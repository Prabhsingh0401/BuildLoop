import { Router } from 'express';
import feedbackRoutes from './feedback.routes.js';
import insightRoutes from './insight.routes.js';

const router = Router();

router.use('/feedback', feedbackRoutes);
router.use('/insights', insightRoutes);

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

export default router;