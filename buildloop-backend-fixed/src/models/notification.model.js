import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
  },
  type: {
    type: String,
    enum: ['PROJECT_ASSIGNMENT', 'TASK_ASSIGNMENT', 'TASK_COMMENT'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
  }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
