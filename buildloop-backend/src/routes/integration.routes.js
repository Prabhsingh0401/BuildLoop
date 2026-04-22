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
import {
  getGithubStatus,
  connectGithub,
  disconnectGithub,
  getRepos,
  getRepoContents,
  getRepoTree,
  getCommits,
  getPullRequests,
  syncGithubRepo
} from '../services/github.service.js';

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

// ─────────────────────────────────────────────────────────────────────────────
// GitHub Routes
// ─────────────────────────────────────────────────────────────────────────────



router.get('/github/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const status = await getGithubStatus(projectId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

router.post('/github/connect', async (req, res, next) => {
  try {
    const { projectId, code } = req.body;
    const userId = req.auth?.userId;

    if (!projectId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, code'
      });
    }

    const result = await connectGithub({ projectId, userId, code });
    res.json({
      success: true,
      data: result,
      message: `Connected to GitHub as ${result.username}`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/github/disconnect', async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }
    await disconnectGithub(projectId);
    res.json({ success: true, message: 'GitHub disconnected' });
  } catch (error) {
    next(error);
  }
});

router.get('/github/:projectId/repos', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const repos = await getRepos(projectId);
    res.json({ success: true, data: repos });
  } catch (error) {
    next(error);
  }
});

router.get('/github/:projectId/repos/:owner/:repo/contents', async (req, res, next) => {
  try {
    const { projectId, owner, repo } = req.params;
    const { path } = req.query; // optional
    const contents = await getRepoContents(projectId, owner, repo, path);
    res.json({ success: true, data: contents });
  } catch (error) {
    next(error);
  }
});

router.get('/github/:projectId/repos/:owner/:repo/tree', async (req, res, next) => {
  try {
    const { projectId, owner, repo } = req.params;
    const tree = await getRepoTree(projectId, owner, repo);
    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
});

router.get('/github/:projectId/repos/:owner/:repo/commits', async (req, res, next) => {
  try {
    const { projectId, owner, repo } = req.params;
    const commits = await getCommits(projectId, owner, repo);
    res.json({ success: true, data: commits });
  } catch (error) {
    next(error);
  }
});

router.get('/github/:projectId/repos/:owner/:repo/pulls', async (req, res, next) => {
  try {
    const { projectId, owner, repo } = req.params;
    const pulls = await getPullRequests(projectId, owner, repo);
    res.json({ success: true, data: pulls });
  } catch (error) {
    next(error);
  }
});

router.post('/github/:projectId/repos/:owner/:repo/sync', async (req, res, next) => {
  try {
    const { projectId, owner, repo } = req.params;
    const userId = req.auth?.userId;
    const result = await syncGithubRepo(projectId, owner, repo, userId);
    res.json({ success: true, data: result, message: `Synced ${result.syncedFiles} files from the repository to your workspace.` });
  } catch (error) {
    next(error);
  }
});

export default router;
