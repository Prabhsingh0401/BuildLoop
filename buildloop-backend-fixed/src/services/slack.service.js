import { WebClient } from '@slack/web-api';
import { ingestFeedback } from './ingestion.service.js';
import { SlackIntegration } from '../models/integration.model.js';
import AppError from '../utils/AppError.js';

/**
 * Connect to Slack workspace and store credentials
 */
export async function connectSlack({ projectId, userId, botToken, channelName }) {
  const client = new WebClient(botToken);

  // Verify token works and get workspace info
  let authTest;
  try {
    authTest = await client.auth.test();
  } catch (err) {
    throw new AppError(`Invalid Slack bot token: ${err.message}`, 401);
  }

  if (!authTest.ok) {
    throw new AppError('Invalid Slack bot token', 401);
  }

  // Get channel ID from channel name
  let channels;
  try {
    channels = await client.conversations.list({
      types: 'public_channel'
    });
  } catch (err) {
    throw new AppError(`Cannot list channels: ${err.message}. Make sure your bot has channels:read scope.`, 403);
  }

  const cleanChannelName = channelName.replace('#', '').toLowerCase();
  const channel = channels.channels.find(
    ch => ch.name.toLowerCase() === cleanChannelName
  );

  if (!channel) {
    const available = channels.channels.slice(0, 5).map(c => '#' + c.name).join(', ');
    throw new AppError(`Channel "${channelName}" not found. Available channels: ${available}`, 404);
  }

  // Check bot membership in channel
  const channelInfo = await client.conversations.members({
    channel: channel.id
  });

  if (!channelInfo.members.includes(authTest.user_id)) {
    throw new AppError(`Bot must be invited to #${channel.name} first. Use "/invite @YourBot" in Slack.`, 403);
  }

  // Deactivate any existing integrations for this project
  await SlackIntegration.updateMany(
    { projectId },
    { isActive: false }
  );

  // Save new integration
  const integration = await SlackIntegration.create({
    projectId,
    createdBy: userId,
    workspaceName: authTest.team || authTest.enterprise || 'Unknown',
    channelName: channel.name,
    channelId: channel.id,
    botToken,
    isActive: true,
    lastSyncTimestamp: null
  });

  return {
    workspaceName: integration.workspaceName,
    channelName: integration.channelName,
    connectedAt: integration.createdAt
  };
}

/**
 * Disconnect Slack integration
 */
export async function disconnectSlack(projectId) {
  await SlackIntegration.findOneAndUpdate(
    { projectId },
    { isActive: false }
  );
  return { success: true };
}

/**
 * Get Slack integration status
 */
export async function getSlackStatus(projectId) {
  const integration = await SlackIntegration.findOne({
    projectId,
    isActive: true
  });

  if (!integration) {
    return { connected: false };
  }

  return {
    connected: true,
    workspaceName: integration.workspaceName,
    channelName: integration.channelName,
    lastSyncAt: integration.lastSyncTimestamp
  };
}

/**
 * Fetch and ingest messages from Slack channel
 */
export async function syncSlackMessages({ projectId, userId, limit = 100 }) {
  const integration = await SlackIntegration.findOne({
    projectId,
    isActive: true
  }).select('+botToken');

  if (!integration) {
    throw new AppError('Slack integration not found', 404);
  }

  const client = new WebClient(integration.botToken);

  // Fetch messages
  const result = await client.conversations.history({
    channel: integration.channelId,
    limit,
    oldest: integration.lastSyncTimestamp
      ? (integration.lastSyncTimestamp.getTime() / 1000).toString()
      : undefined
  });

  if (!result.ok || !result.messages) {
    throw new AppError('Failed to fetch Slack messages', 500);
  }

  // Filter out bot messages and system messages, only keep user messages with text
  const userMessages = result.messages.filter(
    msg => !msg.subtype && msg.type === 'message' && msg.text && msg.text.length > 10
  );

  if (userMessages.length === 0) {
    return { ingested: 0, messages: [] };
  }

  // Group messages by user/thread for context
  const threads = {};
  userMessages.forEach(msg => {
    const threadKey = msg.thread_ts || msg.ts;
    if (!threads[threadKey]) {
      threads[threadKey] = [];
    }
    threads[threadKey].push(msg);
  });

  // Ingest each thread as a feedback document
  const ingested = [];
  for (const [threadTs, messages] of Object.entries(threads)) {
    const rawText = messages
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
      .map(msg => msg.text)
      .join('\n\n---\n\n');

    if (rawText.length >= 50) {
      const result = await ingestFeedback({
        rawText: `[Slack #${integration.channelName}]\n\n${rawText}`,
        projectId,
        createdBy: userId,
        source: 'slack',
        metaType: 'other'
      });

      ingested.push(result);
    }
  }

  // Update last sync timestamp
  integration.lastSyncTimestamp = new Date();
  await integration.save();

  return {
    ingested: ingested.length,
    messages: userMessages.map(m => ({
      ts: m.ts,
      text: m.text.substring(0, 100) + (m.text.length > 100 ? '...' : '')
    }))
  };
}
