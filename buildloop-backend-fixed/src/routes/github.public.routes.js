/**
 * Public GitHub OAuth routes — no Clerk auth required.
 * These are mounted BEFORE the auth middleware in index.js so the browser
 * can reach them during the OAuth redirect flow.
 *
 * Endpoints exposed here:
 *   GET  /api/integrations/github/client-id   → return the GitHub App client ID
 *   GET  /api/integrations/github/callback    → exchange OAuth code for token (server-side)
 */
import { Router } from 'express';
import { connectGithub } from '../services/github.service.js';

const router = Router();

/**
 * GET /api/integrations/github/client-id
 * Returns the GitHub OAuth App client ID so the frontend can build the
 * authorization URL.  Must be public — called before the user is redirected.
 */
router.get('/client-id', (req, res) => {
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: 'GitHub OAuth not configured on server'
    });
  }
  res.json({ success: true, data: { clientId } });
});

/**
 * POST /api/integrations/github/callback
 * Called by the frontend after GitHub redirects back with `?code=` and `?state=`.
 * The `state` value carries the JSON-encoded { projectId, userId } so we can
 * associate the token with the right project without relying on session cookies.
 *
 * Body: { code: string, projectId: string, userId?: string }
 */
router.post('/callback', async (req, res, next) => {
  try {
    const { code, projectId, userId } = req.body;

    if (!code || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, projectId'
      });
    }

    const result = await connectGithub({ projectId, userId: userId || 'anonymous', code });
    res.json({
      success: true,
      data: result,
      message: `Connected to GitHub as ${result.username}`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
