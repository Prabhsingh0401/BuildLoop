import express from 'express';
import mongoose from 'mongoose';
import { Feature } from '../models/feature.model.js';
import { Task } from '../models/task.model.js';

// Replace with exact auth middleware import confirmed from
// buildloop-backend/src/middlewares/
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

const ALLOWED_PATCH_FIELDS = ['title', 'description', 'effort', 'impact', 'status'];
const VALID_EFFORT   = ['low', 'medium', 'high'];
const VALID_IMPACT   = ['low', 'medium', 'high'];
const VALID_STATUS   = ['backlog', 'todo', 'in_progress', 'done'];

// ─── GET /api/features/:projectId ────────────────────────────────
// Returns all FeatureDocuments for a projectId sorted by
// priorityScore descending. Returns 400 for invalid projectId.
// Auth: required.
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }

    const features = await Feature
      .find({ projectId })
      .sort({ priorityScore: -1 });

    return res.status(200).json({ features });
  } catch (err) {
    console.error('[GET /api/features/:projectId]', err);
    return res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// ─── PATCH /api/features/:id ──────────────────────────────────────
// Updates only: title, description, effort, impact, status.
// Rejects any other field with 400.
// Returns 404 if feature not found.
// Auth: required.
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid feature id format' });
    }

    const body           = req.body;
    const incomingFields = Object.keys(body);

    const rejectedFields = incomingFields.filter(
      (f) => !ALLOWED_PATCH_FIELDS.includes(f)
    );
    if (rejectedFields.length > 0) {
      return res.status(400).json({
        error: `These fields cannot be updated: ${rejectedFields.join(', ')}`,
      });
    }

    if (body.effort !== undefined && !VALID_EFFORT.includes(body.effort)) {
      return res.status(400).json({
        error: `effort must be one of: ${VALID_EFFORT.join(', ')}`,
      });
    }
    if (body.impact !== undefined && !VALID_IMPACT.includes(body.impact)) {
      return res.status(400).json({
        error: `impact must be one of: ${VALID_IMPACT.join(', ')}`,
      });
    }
    if (body.status !== undefined && !VALID_STATUS.includes(body.status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUS.join(', ')}`,
      });
    }

    const feature = await Feature.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    return res.status(200).json({ feature });
  } catch (err) {
    console.error('[PATCH /api/features/:id]', err);
    return res.status(500).json({ error: 'Failed to update feature' });
  }
});

// ─── POST /api/features/:id/task ─────────────────────────────────
// Promotes a feature to a task.
// Looks up FeatureDocument by :id.
// Creates TaskDocument with:
//   title     → copied from feature.title exactly
//   status    → hardcoded 'todo'
//   featureId → feature._id
//   projectId → feature.projectId
// Returns 409 if a task for this feature already exists.
// Returns 404 if feature not found.
// Returns 400 if :id is not a valid ObjectId.
// Auth: required.
router.post('/:id/task', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid feature id format' });
    }

    const feature = await Feature.findById(id);
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    // Prevent duplicate tasks from multiple Promote button clicks
    const existing = await Task.findOne({ featureId: feature._id });
    if (existing) {
      return res.status(409).json({
        error: 'A task has already been promoted from this feature',
        task: existing,
      });
    }

    const task = await Task.create({
      title:     feature.title,
      status:    'todo',
      featureId: feature._id,
      projectId: feature.projectId,
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error('[POST /api/features/:id/task]', err);
    return res.status(500).json({ error: 'Failed to promote feature to task' });
  }
});

export default router;
