import mongoose from 'mongoose';

const SlackIntegrationSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  workspaceName: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  botToken: {
    type: String,
    required: true,
    select: false
  },
  channelId: {
    type: String,
    required: true
  },
  lastSyncTimestamp: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const RedditIntegrationSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  subredditName: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true,
    select: false
  },
  clientSecret: {
    type: String,
    required: true,
    select: false
  },
  refreshToken: {
    type: String,
    required: true,
    select: false
  },
  accessToken: {
    type: String,
    select: false
  },
  tokenExpiry: {
    type: Date,
    default: null
  },
  lastSyncTimestamp: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for lookups (not unique - allows reconnecting with different channels/subreddits)
SlackIntegrationSchema.index({ projectId: 1 });
RedditIntegrationSchema.index({ projectId: 1 });

export const SlackIntegration = mongoose.model(
  'SlackIntegration',
  SlackIntegrationSchema,
  process.env.COLLECTION_SLACK_INTEGRATIONS || 'slack_integrations'
);

export const RedditIntegration = mongoose.model(
  'RedditIntegration',
  RedditIntegrationSchema,
  process.env.COLLECTION_REDDIT_INTEGRATIONS || 'reddit_integrations'
);
