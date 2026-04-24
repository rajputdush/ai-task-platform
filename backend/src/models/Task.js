const mongoose = require('mongoose');

const OPERATIONS = ['uppercase', 'lowercase', 'reverse', 'word_count'];
const STATUSES = ['pending', 'running', 'success', 'failed'];

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  inputText: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  operation: {
    type: String,
    enum: OPERATIONS,
    required: true,
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'pending',
    index: true,
  },
  result: {
    type: String,
    default: null,
  },
  logs: [{
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'error', 'debug'], default: 'info' },
    message: String,
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

// Compound indexes for common queries
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ status: 1, createdAt: 1 }); // For worker polling

const Task = mongoose.model('Task', taskSchema);
module.exports = { Task, OPERATIONS, STATUSES };
