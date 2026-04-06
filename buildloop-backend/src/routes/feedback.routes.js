import { Router } from 'express';
import { Feedback } from '../models/feedback.model.js';
import { ingestFeedback } from '../services/ingestion.service.js';
import { deleteVectors } from '../lib/pinecone.js';

const router = Router();

/**
 * Task 1 — POST /api/feedback
 * Main entry point for user feedback ingestion.
 */
router.post('/', async (req, res, next) => {
  try {
    const { rawText, projectId, source, metaType } = req.body;
    const userId = req.auth?.userId;

    if (!rawText || rawText.length < 100) {
      return res.status(400).json({
        success: false,
        message: 'Feedback text must be at least 100 characters long.'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required.'
      });
    }

    const result = await ingestFeedback({
      rawText,
      projectId,
      createdBy: userId,
      source: source || 'paste',
      metaType: metaType || 'other'
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Task 2 — GET /api/feedback/:projectId
 * Lists feedback for a specific project.
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const feedbacks = await Feedback.find({ projectId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Task 2 — DELETE /api/feedback/:id
 * Deletes feedback from Pinecone and MongoDB.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback document not found.'
      });
    }

    // Delete vectors from Pinecone first
    if (feedback.pineconeIds && feedback.pineconeIds.length > 0) {
      await deleteVectors(feedback.pineconeIds, 'feedback');
    }

    // Delete from MongoDB
    await Feedback.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Feedback and associated vectors deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
