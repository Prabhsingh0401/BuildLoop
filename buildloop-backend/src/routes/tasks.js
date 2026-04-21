import express from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/task.model.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Allowed fields for PATCH
const ALLOWED_PATCH_FIELDS = ['status', 'assignee', 'tags', 'description', 'title', 'featureId'];

// Valid status values from spec
const VALID_STATUSES = ['todo', 'in-progress', 'review', 'done'];

// ─── GET /api/tasks/:projectId ────────────────────────────────────
// Returns all TaskDocuments for a projectId, newest first.
// Returns 400 if projectId is not a valid ObjectId.
// Auth: required.
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    return res.status(200).json({ tasks });
  } catch (err) {
    console.error('[GET /api/tasks/:projectId]', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ─── POST /api/tasks ──────────────────────────────────────────────
// Creates a task manually.
// Required body: title, projectId
// Optional body: description, tags, assignee, featureId
// Returns 400 if required fields are missing or invalid.
// Auth: required.
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      projectId,
      description,
      tags,
      assignee,
      featureId,
      status,
    } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        error: 'projectId is required and must be a valid ObjectId',
      });
    }

    // Validate optional featureId if provided
    if (featureId && !mongoose.Types.ObjectId.isValid(featureId)) {
      return res.status(400).json({
        error: 'featureId must be a valid ObjectId',
      });
    }

    // Validate tags is an array if provided
    if (tags !== undefined && !Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags must be an array' });
    }

    const task = await Task.create({
      title:       title.trim(),
      projectId,
      description: description ?? '',
      tags:        Array.isArray(tags) ? tags : [],
      assignee:    assignee ?? null,
      featureId:   featureId ?? null,
      status:      status ?? 'todo',
    });

    return res.status(201).json({ task });
  } catch (err) {
    return res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message || 'Failed to create task' });
  }
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────
// Updates allowed fields: status, assignee, tags, description, title, featureId.
// Returns 400 if any field outside the allowed list is sent.
// Returns 400 if status value is not a valid enum value.
// Returns 404 if task not found.
// Auth: required.
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task id format' });
    }

    const body          = req.body;
    const incomingFields = Object.keys(body);

    // Reject any field not in the allowed list
    const rejectedFields = incomingFields.filter(
      (f) => !ALLOWED_PATCH_FIELDS.includes(f)
    );
    if (rejectedFields.length > 0) {
      return res.status(400).json({
        error: `These fields cannot be updated: ${rejectedFields.join(', ')}`,
      });
    }

    // Validate status value if provided
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Validate tags is an array if provided
    if (body.tags !== undefined && !Array.isArray(body.tags)) {
      return res.status(400).json({ error: 'tags must be an array' });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({ task });
  } catch (err) {
    console.error('[PATCH /api/tasks/:id]', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────
// Deletes a task by ID.
// Returns 404 if task not found.
// Auth: required.
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task id format' });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});


export default router;
