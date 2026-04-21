import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feature',
      default: null,
    },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    assignee:    { type: String, default: null },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', TaskSchema, process.env.COLLECTION_TASKS || 'tasks');
