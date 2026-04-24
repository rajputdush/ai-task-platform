"""
AI Task Processing Worker
Processes tasks from Redis queue and updates MongoDB.
Includes DB polling fallback for Redis failures.
"""

import os
import json
import time
import signal
import logging
import threading
from datetime import datetime, timezone

import redis
from pymongo import MongoClient
from bson import ObjectId

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("worker")

# ── Config ────────────────────────────────────────────────────────────────────
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD") or None
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ai-task-platform")
TASK_QUEUE = "task_queue"
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", 5))   # DB fallback polling
WORKER_ID = os.getenv("HOSTNAME", "worker-0")

# ── Graceful shutdown ─────────────────────────────────────────────────────────
shutdown_event = threading.Event()

def _handle_signal(signum, frame):
    log.info(f"Received signal {signum}, shutting down...")
    shutdown_event.set()

signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)


# ── Operations ────────────────────────────────────────────────────────────────
def process_operation(operation: str, text: str) -> str:
    if operation == "uppercase":
        return text.upper()
    elif operation == "lowercase":
        return text.lower()
    elif operation == "reverse":
        return text[::-1]
    elif operation == "word_count":
        count = len(text.split())
        return f"Word count: {count}"
    else:
        raise ValueError(f"Unknown operation: {operation}")


# ── MongoDB helpers ────────────────────────────────────────────────────────────
def get_mongo_collection():
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client.get_default_database()
    return db["tasks"]


def update_task_running(col, task_id: str):
    col.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "status": "running",
                "startedAt": datetime.now(timezone.utc),
            },
            "$push": {
                "logs": {
                    "timestamp": datetime.now(timezone.utc),
                    "level": "info",
                    "message": f"Worker {WORKER_ID} picked up task",
                }
            },
        },
    )


def update_task_success(col, task_id: str, result: str):
    col.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "status": "success",
                "result": result,
                "completedAt": datetime.now(timezone.utc),
            },
            "$push": {
                "logs": {
                    "timestamp": datetime.now(timezone.utc),
                    "level": "info",
                    "message": "Task completed successfully",
                }
            },
        },
    )


def update_task_failed(col, task_id: str, error: str):
    col.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "status": "failed",
                "errorMessage": error,
                "completedAt": datetime.now(timezone.utc),
            },
            "$push": {
                "logs": {
                    "timestamp": datetime.now(timezone.utc),
                    "level": "error",
                    "message": f"Task failed: {error}",
                }
            },
        },
    )


# ── Core task execution ────────────────────────────────────────────────────────
def execute_task(col, task_id: str, operation: str, input_text: str):
    log.info(f"Executing task {task_id} op={operation}")
    update_task_running(col, task_id)
    try:
        result = process_operation(operation, input_text)
        update_task_success(col, task_id, result)
        log.info(f"Task {task_id} succeeded")
    except Exception as exc:
        update_task_failed(col, task_id, str(exc))
        log.error(f"Task {task_id} failed: {exc}")


# ── Redis queue consumer ───────────────────────────────────────────────────────
def redis_consumer(col):
    r = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
    )
    log.info("Redis consumer started")

    while not shutdown_event.is_set():
        try:
            # Blocking pop with 2-second timeout so we can check shutdown_event
            item = r.brpop(TASK_QUEUE, timeout=2)
            if item is None:
                continue
            _, payload = item
            data = json.loads(payload)
            execute_task(col, data["taskId"], data["operation"], data["inputText"])
        except redis.exceptions.ConnectionError as exc:
            log.warning(f"Redis connection error: {exc}. Retrying in 5s...")
            time.sleep(5)
        except Exception as exc:
            log.error(f"Unexpected error in redis consumer: {exc}")
            time.sleep(1)


# ── DB polling fallback ────────────────────────────────────────────────────────
def db_poll_fallback(col):
    """
    Safety net: picks up tasks that never made it into Redis
    (e.g., backend Redis push failure).
    """
    log.info("DB polling fallback started")
    while not shutdown_event.is_set():
        try:
            task = col.find_one_and_update(
                {"status": "pending"},
                {"$set": {"status": "running", "startedAt": datetime.now(timezone.utc)}},
                sort=[("createdAt", 1)],
                return_document=True,
            )
            if task:
                log.info(f"DB poll picked up missed task {task['_id']}")
                execute_task(
                    col,
                    str(task["_id"]),
                    task["operation"],
                    task["inputText"],
                )
        except Exception as exc:
            log.error(f"DB poll error: {exc}")

        shutdown_event.wait(POLL_INTERVAL)


# ── Entrypoint ────────────────────────────────────────────────────────────────
def main():
    log.info(f"Worker {WORKER_ID} starting up...")

    col = get_mongo_collection()
    log.info("MongoDB connected")

    # Start DB polling fallback in a background thread
    poll_thread = threading.Thread(target=db_poll_fallback, args=(col,), daemon=True)
    poll_thread.start()

    # Main loop: Redis consumer (blocking)
    redis_consumer(col)

    log.info(f"Worker {WORKER_ID} shut down cleanly")


if __name__ == "__main__":
    main()
