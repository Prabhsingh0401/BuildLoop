import fetch from 'node-fetch';
import { ingestFeedback } from './ingestion.service.js';
import { RedditIntegration } from '../models/integration.model.js';
import AppError from '../utils/AppError.js';

const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

/**
 * Get a fresh access token using refresh token
 */
async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'BuildLoop/1.0'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new AppError('Failed to refresh Reddit access token', 401);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Get valid access token, refresh if needed
 */
async function getValidAccessToken(integration) {
  // Check if token is expired or will expire in 5 minutes
  const now = new Date();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes

  if (!integration.accessToken || !integration.tokenExpiry ||
      new Date(integration.tokenExpiry).getTime() - expiryBuffer < now.getTime()) {
    // Token needs refresh
    const refreshed = await refreshAccessToken(
      integration.clientId,
      integration.clientSecret,
      integration.refreshToken
    );

    integration.accessToken = refreshed.accessToken;
    integration.tokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);
    await integration.save();
  }

  return integration.accessToken;
}

/**
 * Connect to Reddit and store credentials
 */
export async function connectReddit({ projectId, userId, clientId, clientSecret, refreshToken, subredditName }) {
  // Clean up subreddit name (remove r/ prefix if present)
  const cleanSubreddit = subredditName.replace(/^r\//, '');

  // Test the credentials by getting an access token
  let accessToken;
  try {
    const refreshed = await refreshAccessToken(clientId, clientSecret, refreshToken);
    accessToken = refreshed.accessToken;
  } catch (err) {
    throw new AppError('Invalid Reddit credentials. Check Client ID, Secret, and Refresh Token.', 401);
  }

  // Verify subreddit exists and is accessible
  const response = await fetch(`${REDDIT_API_BASE}/r/${cleanSubreddit}/about`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'BuildLoop/1.0'
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new AppError(`Subreddit r/${cleanSubreddit} is private or restricted.`, 403);
    }
    if (response.status === 404) {
      throw new AppError(`Subreddit r/${cleanSubreddit} not found.`, 404);
    }
    throw new AppError('Failed to verify subreddit access', 500);
  }

  const subredditData = await response.json();

  // Deactivate any existing integrations for this project
  await RedditIntegration.updateMany(
    { projectId },
    { isActive: false }
  );

  // Save new integration
  const integration = await RedditIntegration.create({
    projectId,
    createdBy: userId,
    subredditName: cleanSubreddit,
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
    tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour default
    isActive: true,
    lastSyncTimestamp: null
  });

  return {
    subredditName: integration.subredditName,
    displayName: subredditData.data?.display_name_prefixed || `r/${cleanSubreddit}`,
    subscribers: subredditData.data?.subscribers || 0,
    connectedAt: integration.createdAt
  };
}

/**
 * Disconnect Reddit integration
 */
export async function disconnectReddit(projectId) {
  await RedditIntegration.findOneAndUpdate(
    { projectId },
    { isActive: false }
  );
  return { success: true };
}

/**
 * Get Reddit integration status
 */
export async function getRedditStatus(projectId) {
  const integration = await RedditIntegration.findOne({
    projectId,
    isActive: true
  });

  if (!integration) {
    return { connected: false };
  }

  return {
    connected: true,
    subredditName: integration.subredditName,
    lastSyncAt: integration.lastSyncTimestamp
  };
}

/**
 * Fetch and ingest posts from Reddit
 */
export async function syncRedditPosts({ projectId, userId, limit = 25, sort = 'new' }) {
  const integration = await RedditIntegration.findOne({
    projectId,
    isActive: true
  }).select('+clientId +clientSecret +refreshToken +accessToken');

  if (!integration) {
    throw new AppError('Reddit integration not found', 404);
  }

  const accessToken = await getValidAccessToken(integration);

  // Fetch posts
  const response = await fetch(
    `${REDDIT_API_BASE}/r/${integration.subredditName}/${sort}?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'BuildLoop/1.0'
      }
    }
  );

  if (!response.ok) {
    throw new AppError('Failed to fetch Reddit posts', 500);
  }

  const data = await response.json();
  const posts = data.data?.children || [];

  // Filter posts by timestamp if we have a last sync
  const lastSync = integration.lastSyncTimestamp?.getTime() || 0;
  const newPosts = posts.filter(post => {
    const postTime = post.data.created_utc * 1000;
    return postTime > lastSync;
  });

  if (newPosts.length === 0) {
    return { ingested: 0, posts: [] };
  }

  // Ingest each post
  const ingested = [];
  for (const post of newPosts) {
    const { title, selftext, url, author } = post.data;

    // Combine title and body
    let rawText = `[Reddit r/${integration.subredditName}]\n\nTitle: ${title}\n\n`;
    if (selftext) {
      rawText += selftext;
    } else {
      rawText += `Link: ${url}`;
    }

    if (rawText.length >= 50) {
      const result = await ingestFeedback({
        rawText,
        projectId,
        createdBy: userId,
        source: 'reddit',
        metaType: 'review'
      });

      ingested.push(result);
    }
  }

  // Update last sync timestamp
  integration.lastSyncTimestamp = new Date();
  await integration.save();

  return {
    ingested: ingested.length,
    posts: newPosts.map(p => ({
      id: p.data.id,
      title: p.data.title.substring(0, 100),
      author: p.data.author
    }))
  };
}
