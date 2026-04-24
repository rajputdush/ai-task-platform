const express = require('express');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');

const router = express.Router();

router.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'error';
  let redisStatus = 'ok';
  try {
    const redis = getRedisClient();
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  const healthy = dbStatus === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    services: { mongodb: dbStatus, redis: redisStatus },
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

module.exports = router;
