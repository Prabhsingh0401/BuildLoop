import { Router } from 'express';
import {
  connectSlack,
  disconnectSlack,
  getSlackStatus,
  syncSlackMessages
} from '../services/slack.service.js';
import {
  connectReddit,
  disconnectReddit,
  getRedditStatus,
  syncRedditPosts
} from '../services/reddit.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Slack Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/integrations/slack/:projectId - Get Slack connection status
 */
router.get('/slack/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const status = await getSlackStatus(projectId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/slack/connect - Connect Slack workspace
 */
router.post('/slack/connect', async (req, res, next) => {
  try {
    const { projectId, botToken, channelName } = req.body;
    const userId = req.auth?.userId;

    if (!projectId || !botToken || !channelName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, botToken, channelName'
      });
    }

    const result = await connectSlack({
      projectId,
      userId,
      botToken,
      channelName: channelName.replace('#', '')
    });

    res.json({
      success: true,
      data: result,
      message: `Connected to Slack workspace "${result.workspaceName}" in #${result.channelName}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/slack/disconnect - Disconnect Slack
 */
router.post('/slack/disconnect', async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    await disconnectSlack(projectId);
    res.json({ success: true, message: 'Slack disconnected' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/slack/sync - Sync Slack messages
 */
router.post('/slack/sync', async (req, res, next) => {
  try {
    const { projectId, limit = 100 } = req.body;
    const userId = req.auth?.userId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    const result = await syncSlackMessages({ projectId, userId, limit });
    res.json({
      success: true,
      data: result,
      message: `Synced ${result.ingested} messages from Slack`
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Reddit Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/integrations/reddit/:projectId - Get Reddit connection status
 */
router.get('/reddit/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const status = await getRedditStatus(projectId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/reddit/connect - Connect Reddit subreddit
 */
router.post('/reddit/connect', async (req, res, next) => {
  try {
    const { projectId, clientId, clientSecret, refreshToken, subredditName } = req.body;
    const userId = req.auth?.userId;

    if (!projectId || !clientId || !clientSecret || !refreshToken || !subredditName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, clientId, clientSecret, refreshToken, subredditName'
      });
    }

    const result = await connectReddit({
      projectId,
      userId,
      clientId,
      clientSecret,
      refreshToken,
      subredditName
    });

    res.json({
      success: true,
      data: result,
      message: `Connected to r/${result.subredditName} (${result.subscribers.toLocaleString()} subscribers)`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/reddit/disconnect - Disconnect Reddit
 */
router.post('/reddit/disconnect', async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    await disconnectReddit(projectId);
    res.json({ success: true, message: 'Reddit disconnected' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/reddit/sync - Sync Reddit posts
 */
router.post('/reddit/sync', async (req, res, next) => {
  try {
    const { projectId, limit = 25, sort = 'new' } = req.body;
    const userId = req.auth?.userId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    const result = await syncRedditPosts({ projectId, userId, limit, sort });
    res.json({
      success: true,
      data: result,
      message: `Synced ${result.ingested} posts from Reddit`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
