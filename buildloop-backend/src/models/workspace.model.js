import mongoose from 'mongoose';

/**
 * @typedef {Object} WorkspaceContext
 * @property {mongoose.Types.ObjectId} _id
 * @property {mongoose.Types.ObjectId} projectId - Scoped to project
 * @property {string} fileName - File name/identifier
 * @property {string} language - Programming language
 * @property {string} rawContent - Full file text content
 * @property {string[]} chunks - Split content + pinecone IDs
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const WorkspaceSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  rawContent: {
    type: String,
    required: true
  },
  chunks: [{
    type: String
  }]
}, { timestamps: true });

export const Workspace = mongoose.model('Workspace', WorkspaceSchema);
