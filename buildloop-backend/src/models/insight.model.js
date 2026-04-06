import mongoose from 'mongoose';

const InsightSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  feedbackIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Feedback' 
  }],
  clusterLabel: { 
    type: String, 
    required: true 
  },
  summary: { 
    type: String, 
    required: true 
  },
  sentiment: { 
    type: String, 
    enum: ['positive', 'negative', 'mixed'], 
    required: true 
  },
  frequency: { 
    type: Number, 
    required: true 
  },
  representativeQuotes: [{ 
    type: String 
  }]
}, { 
  timestamps: true 
});

export const Insight = mongoose.model('Insight', InsightSchema, process.env.COLLECTION_INSIGHTS || 'insights');
