import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: String, // Clerk userId
      required: true,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model(
  'Project',
  projectSchema,
  process.env.COLLECTION_PROJECTS || 'projects'
);
