import { Router } from 'express';
import feedbackRoutes from './feedback.routes.js';
import insightRoutes from './insight.routes.js';
import workspaceRoutes from './workspace.routes.js';
import taskRoutes from './tasks.js';
import featureRoutes from './features.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

router.use('/feedback', feedbackRoutes);
router.use('/insights', insightRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/features', featureRoutes);

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

export default router;
