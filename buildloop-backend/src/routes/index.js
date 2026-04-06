import { Router } from 'express';
import feedbackRoutes from './feedback.routes.js';
import insightRoutes from './insight.routes.js';
import workspaceRoutes from './workspace.routes.js';

const router = Router();

router.use('/feedback', feedbackRoutes);
router.use('/insights', insightRoutes);
router.use('/workspace', workspaceRoutes);

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

export default router;