import mongoose from 'mongoose';

/**
 * @typedef {Object} FeatureDocument
 * @property {mongoose.Types.ObjectId} _id
 * @property {mongoose.Types.ObjectId[]} insightIds - Source insight references
 * @property {string} title - Feature name
 * @property {number} priorityScore - 0-100 (LLM + heuristic score)
 * @property {string} priorityRationale - Explanation of priority rank
 * @property {'low'|'medium'|'high'} effort - Engineering estimate
 * @property {'low'|'medium'|'high'} impact - Business value estimate
 * @property {'backlog'|'todo'|'in_progress'|'done'} status - Kanban state
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const FeatureSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  insightIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight'
  }],
  title: {
    type: String,
    required: true
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  priorityRationale: {
    type: String,
    required: true
  },
  effort: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'done'],
    default: 'todo'
  }
}, { timestamps: true });

export const Feature = mongoose.model('Feature', FeatureSchema, process.env.COLLECTION_FEATURES || 'features');
