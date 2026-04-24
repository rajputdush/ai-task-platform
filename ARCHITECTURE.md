# TaskForge — Architecture Document

## 1. System Overview

TaskForge is a MERN-stack AI task processing platform that accepts text-transformation jobs from authenticated users, processes them asynchronously via a Python worker fleet, and streams results back to the UI in near-real-time.

```
Browser → React SPA
            │  HTTPS
            ▼
        nginx (Ingress)
       /               \
  /api/*             /* (static)
      │
  Node.js API
  (Express + JWT)
       │
  MongoDB ← writes task records
       │
  Redis Queue ──► Python Worker(s)
                        │
                  MongoDB ← writes results + logs
```

---

## 2. Worker Scaling Strategy

### Current Architecture
Workers consume tasks from a Redis list (`LPUSH` / `BRPOP`). Each worker replica holds a single blocking-pop loop, so N replicas = N concurrent tasks. A secondary thread in every worker polls MongoDB every 5 seconds to recover tasks that were created during a Redis outage.

### Scaling to 100k Tasks/Day
100k tasks/day ≈ 1.16 tasks/second on average, but real traffic is bursty (spikes during business hours).

**Horizontal Pod Autoscaler** scales workers on CPU utilisation:
- Min replicas: 2 (always-on fault tolerance)
- Max replicas: 10
- Scale-up trigger: CPU > 70% for 1 minute
- Scale-down: CPU < 30% for 5 minutes (cool-down)

At average throughput a single worker handles ~2–5 tasks/second depending on payload size, so 4–6 replicas comfortably cover the average load. HPA handles burst spikes up to 10 replicas (~10–50 tasks/second).

**For 10× growth (1 M tasks/day):**
- Replace Redis list with Redis Streams or a dedicated queue (RabbitMQ / Kafka) for consumer groups, redelivery guarantees, and dead-letter queues.
- Separate the worker into a dedicated micro-service with its own scaling policy.
- Add a metrics-based HPA trigger using Prometheus + KEDA (Kubernetes Event-Driven Autoscaling) keyed on Redis queue depth rather than CPU.

---

## 3. High Task Volume Handling (100k Tasks/Day)

### API Layer
- Rate limiting: 100 req/15 min per IP globally; auth endpoints limited more tightly.
- Pagination on task listing queries (default page size: 20).
- Backend replicas: 2–3, behind a ClusterIP service load-balanced by kube-proxy.

### Queue
- Redis `LPUSH` is O(1) and handles millions of operations/second on a single node — more than adequate at 100k/day.
- If Redis becomes a bottleneck, switch to Redis Cluster or Redis Streams with consumer groups.

### Database
- MongoDB handles 100k tasks/day trivially on a single replica set node with proper indexes (see §4).
- Connection pooling via Mongoose (default pool: 5 connections per backend pod × 2 pods = 10 total; increase `maxPoolSize` if needed).
- For > 10× growth: use MongoDB Atlas with horizontal sharding on `userId`.

### Worker
- Two workers × ~3 tasks/second each = ~500k tasks/day theoretical max.
- In practice, operations are CPU-bound Python string ops: each takes < 1 ms, so throughput is limited by Redis round-trip (~0.5 ms), yielding ~600–1000 tasks/second per worker.

---

## 4. Database Indexing Strategy

| Collection | Index | Type | Reason |
|---|---|---|---|
| `tasks` | `{ userId: 1, createdAt: -1 }` | Compound | Dashboard list query — filter by user, sort newest-first |
| `tasks` | `{ userId: 1, status: 1 }` | Compound | Filter by status on dashboard |
| `tasks` | `{ status: 1, createdAt: 1 }` | Compound | Worker DB-polling fallback — find oldest pending tasks |
| `tasks` | `{ status: 1 }` | Single | Stats aggregation |
| `users` | `{ email: 1 }` | Unique | Login lookup |
| `users` | `{ username: 1 }` | Unique | Registration uniqueness |

All indexes are created at application startup via `Task.createIndexes()` which is idempotent. In production, create indexes with `{ background: true }` on large collections to avoid locking.

### Index Pruning
Run `db.tasks.getIndexes()` quarterly and drop any indexes not used by `explain()` query plans. MongoDB Atlas provides index suggestions and unused-index detection built in.

---

## 5. Handling Redis Failure

Redis is a non-critical path component — it accelerates task delivery but is not the source of truth.

**Failure modes and mitigations:**

| Scenario | Mitigation |
|---|---|
| Redis pod crash (brief) | Backend catches the `lpush` error, logs a warning, and saves the task to MongoDB with `status: pending`. Worker DB-polling thread picks it up within `POLL_INTERVAL_SECONDS` (default: 5 s). |
| Redis unavailable > 60 s | All tasks fall back to DB-poll queue. Throughput is limited by poll interval and atomic `findOneAndUpdate`, but correctness is preserved. |
| Redis data loss (no AOF) | Tasks are never deleted from MongoDB until explicitly removed by the user. Workers re-process any `pending` tasks found in DB. |
| Redis OOM | Configure `maxmemory` and `maxmemory-policy noeviction` — Redis will reject new writes rather than evict data silently. Backend handles the rejection and falls back. |

**For production hardening:**
- Enable Redis Persistence: `appendonly yes` with `appendfsync everysec`.
- Deploy Redis Sentinel (3 nodes) or Redis Cluster for HA.
- Use `ioredis` with `enableOfflineQueue: false` to fail fast and trigger fallback immediately.

---

## 6. Staging and Production Environments

Both environments use the same Docker images (immutable tags set by CI). The difference is in Kubernetes configuration managed via Kustomize overlays.

### Promotion Flow

```
feature branch → PR → lint/test ──► merge to develop
                                          │
                                    staging overlay
                                    (1 replica each,
                                     debug logs,
                                     staging URL)
                                          │
                             QA approval + merge to main
                                          │
                                   production overlay
                                   (3 replicas backend/frontend,
                                    2–10 worker replicas via HPA,
                                    info logs, prod URL)
```

### Argo CD Configuration
- `taskforge-staging` app watches the `develop` branch of the infra repo.
- `taskforge-production` app watches the `main` branch.
- Both have `automated.selfHeal: true` — any manual `kubectl` change is reverted within 3 minutes.
- `automated.prune: true` — resources removed from git are removed from the cluster.

### Secrets Management
- Development: `.env` files (never committed).
- Staging/Production: Kubernetes `Secret` objects managed via **Sealed Secrets** (encrypted in git) or **External Secrets Operator** pulling from AWS Secrets Manager / HashiCorp Vault.
- CI secrets (Docker Hub credentials, infra repo token) live in GitHub Actions repository secrets and are never logged.

---

## 7. Security Checklist

- Passwords hashed with bcrypt (cost factor 12).
- JWT tokens signed with HS256; 7-day expiry.
- Helmet middleware sets secure HTTP headers (CSP, HSTS, X-Frame-Options).
- Rate limiting: 100 req/15 min globally; 20 req/15 min on auth endpoints.
- All containers run as non-root users.
- `readOnlyRootFilesystem: true` on backend and worker pods.
- No secrets in repository — all injected via Kubernetes Secrets.
- Ingress enforces HTTPS via cert-manager + Let's Encrypt.
- MongoDB and Redis are cluster-internal only (no NodePort or public LoadBalancer).
