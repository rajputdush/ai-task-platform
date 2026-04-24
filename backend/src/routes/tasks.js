const express = require('express');
const { Task, OPERATIONS } = require('../models/Task');
const { authenticate } = require('../middleware/auth');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// GET /api/tasks - list user's tasks
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(query),
    ]);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - create a task
router.post('/', async (req, res, next) => {
  try {
    const { title, inputText, operation } = req.body;

    if (!title || !inputText || !operation) {
      return res.status(400).json({ error: 'title, inputText, and operation are required' });
    }
    if (!OPERATIONS.includes(operation)) {
      return res.status(400).json({
        error: `Invalid operation. Supported: ${OPERATIONS.join(', ')}`,
      });
    }

    const task = new Task({
      title,
      inputText,
      operation,
      userId: req.user._id,
      status: 'pending',
      logs: [{ level: 'info', message: 'Task created and queued' }],
    });
    await task.save();

    // Push to Redis queue
    try {
      const redis = getRedisClient();
      await redis.lpush('task_queue', JSON.stringify({
        taskId: task._id.toString(),
        operation: task.operation,
        inputText: task.inputText,
      }));
      logger.info(`Task ${task._id} pushed to queue`);
    } catch (redisErr) {
      // Redis failure: log but don't fail the request
      // Worker will poll DB for pending tasks as fallback
      logger.error('Redis push failed, task will be picked up by DB polling:', redisErr.message);
      await Task.findByIdAndUpdate(task._id, {
        $push: { logs: { level: 'error', message: 'Queue push failed; will retry via DB polling' } },
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - get a single task
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/stats/summary - task statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const summary = { pending: 0, running: 0, success: 0, failed: 0, total: 0 };
    stats.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });
    res.json({ stats: summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
