import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  projectId: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: String, 
    required: true 
  }, // Clerk userId
  source: { 
    type: String, 
    enum: ['paste', 'file', 'url'], 
    required: true 
  },
  rawText: { 
    type: String, 
    required: true 
  },
  chunks: [{ 
    type: String 
  }],
  pineconeIds: [{ 
    type: String 
  }],
  metadata: {
    type: { 
      type: String, 
      enum: ['interview', 'review', 'survey', 'other'], 
      default: 'other' 
    }
  }
}, { 
  timestamps: true 
});

export const Feedback = mongoose.model('Feedback', FeedbackSchema, process.env.COLLECTION_FEEDBACKS || 'feedbacks');
