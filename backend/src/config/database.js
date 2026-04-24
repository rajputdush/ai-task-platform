const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-task-platform';
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  logger.info('MongoDB connected');

  // Create indexes on startup
  const { Task } = require('../models/Task');
  await Task.createIndexes();
};

module.exports = connectDB;
