import { Router } from 'express';
import { Insight } from '../models/insight.model.js';
import { prioritizeInsights } from '../services/prioritization.service.js';
import { synthesizeFeedback } from '../services/synthesis.service.js';

const router = Router();

router.post('/synthesize', async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    const clusters = await synthesizeFeedback(projectId);
    res.json({ success: true, data: clusters });
  } catch (err) {
    console.error('[POST /api/insights/synthesize]', err);
    if (err.message.includes('No feedback found')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Synthesis failed' });
  }
});

router.post('/prioritize', async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const features = await prioritizeInsights(projectId);
    res.json({ success: true, data: features });
  } catch (err) {
    console.error('[POST /api/insights/prioritize]', err);

    if (
      err.message.includes('insightIds not found') ||
      err.message.includes('Invalid ObjectId format') ||
      err.message.includes('insightIds must be a non-empty array')
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Prioritization failed' });
  }
});

/**
 * Task 3 — GET /api/insights/:projectId
 * Lists common themes and insights for a project.
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const insights = await Insight.find({ projectId })
      .sort({ frequency: -1 });

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
});

export default router;
