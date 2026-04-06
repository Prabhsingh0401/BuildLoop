import { Router } from 'express';
import { Insight } from '../models/insight.model.js';

const router = Router();

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
