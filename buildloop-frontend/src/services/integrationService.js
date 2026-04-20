const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Get Slack integration status for a project
 */
export async function getSlackStatus(projectId, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/slack/${projectId}`, {
    headers
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to get Slack status');
  }
  return json;
}

/**
 * Connect Slack workspace
 */
export async function connectSlack({ projectId, botToken, channelName }, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/slack/connect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId, botToken, channelName })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to connect Slack');
  }
  return json;
}

/**
 * Disconnect Slack workspace
 */
export async function disconnectSlack(projectId, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/slack/disconnect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to disconnect Slack');
  }
  return json;
}

/**
 * Sync Slack messages
 */
export async function syncSlack({ projectId, limit = 100 }, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/slack/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId, limit })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to sync Slack messages');
  }
  return json;
}

/**
 * Get Reddit integration status for a project
 */
export async function getRedditStatus(projectId, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/reddit/${projectId}`, {
    headers
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to get Reddit status');
  }
  return json;
}

/**
 * Connect Reddit subreddit
 */
export async function connectReddit({
  projectId,
  clientId,
  clientSecret,
  refreshToken,
  subredditName
}, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/reddit/connect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId, clientId, clientSecret, refreshToken, subredditName })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to connect Reddit');
  }
  return json;
}

/**
 * Disconnect Reddit
 */
export async function disconnectReddit(projectId, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/reddit/disconnect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to disconnect Reddit');
  }
  return json;
}

/**
 * Sync Reddit posts
 */
export async function syncReddit({ projectId, limit = 25, sort = 'new' }, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/integrations/reddit/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId, limit, sort })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to sync Reddit posts');
  }
  return json;
}
