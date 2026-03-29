import mongoose from 'mongoose';

/**
 * @typedef {Object} TaskDocument
 * @property {mongoose.Types.ObjectId} _id
 * @property {mongoose.Types.ObjectId} featureId - Optional parent feature
 * @property {string} title - Task title/name
 * @property {string} description - Task details
 * @property {string} assignee - Clerk userId (optional)
 * @property {'todo'|'in_progress'|'done'} status - Board column state
 * @property {string[]} tags - Labels/tags
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const TaskSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  featureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feature',
    required: false
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignee: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  tags: [{
    type: String
  }]
}, { timestamps: true });

export const Task = mongoose.model('Task', TaskSchema);
