import express from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/task.model.js';
import { TeamMember } from '../models/teamMember.model.js';
import { Notification } from '../models/notification.model.js';
import { requireAuth, requirePM, requirePMForTask } from '../middleware/auth.middleware.js';
import { createClerkClient } from '@clerk/backend';

let clerk = null;
const getClerk = () => {
  if (!clerk) clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  return clerk;
};

const router = express.Router();

// Allowed fields for PATCH
const ALLOWED_PATCH_FIELDS = ['status', 'assignee', 'tags', 'description', 'title', 'featureId', 'parentTaskId'];

// Valid status values from spec
const VALID_STATUSES = ['todo', 'in-progress', 'review', 'done'];

// ─── GET /api/tasks/:id/subtasks ──────────────────────────────────
// IMPORTANT: Must be declared BEFORE /:projectId and /:id to avoid shadowing.
// Returns all subtasks for a given parent task ID, sorted oldest-first.
// Auth: required.
router.get('/:id/subtasks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task id format' });
    }
    const subtasks = await Task.find({ parentTaskId: id }).sort({ createdAt: 1 });
    return res.status(200).json({ subtasks });
  } catch (err) {
    console.error('[GET /api/tasks/:id/subtasks]', err);
    return res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// ─── POST /api/tasks/:id/subtasks ─────────────────────────────────
// IMPORTANT: Must be declared BEFORE /:id to avoid shadowing.
// Creates a subtask under the given parent task.
// Required body: title
// Optional body: description, assignee
// Auth: required.
router.post('/:id/subtasks', requireAuth, requirePMForTask(Task), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid parent task id format' });
    }

    const parent = await Task.findById(id);
    if (!parent) {
      return res.status(404).json({ error: 'Parent task not found' });
    }

    const { title, description, assignee } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }

    const subtask = await Task.create({
      title:        title.trim(),
      projectId:    parent.projectId,
      parentTaskId: id,
      description:  description ?? '',
      assignee:     assignee ?? null,
      status:       'todo',
      tags:         [],
    });

    return res.status(201).json({ subtask });
  } catch (err) {
    console.error('[POST /api/tasks/:id/subtasks]', err);
    return res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// ─── GET /api/tasks/:projectId/all-subtasks ───────────────────────
// Returns all subtasks for a project.
router.get('/:projectId/all-subtasks', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }
    const subtasks = await Task.find({ projectId, parentTaskId: { $ne: null } });
    return res.status(200).json({ subtasks });
  } catch (err) {
    console.error('[GET /api/tasks/:projectId/all-subtasks]', err);
    return res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// ─── GET /api/tasks/:projectId ────────────────────────────────────
// Returns all top-level TaskDocuments for a projectId (no subtasks), newest first.
// Returns 400 if projectId is not a valid ObjectId.
// Auth: required.
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }

    // Exclude subtasks (tasks with a parentTaskId set) from the board view
    const tasks = await Task.find({ projectId, parentTaskId: null }).sort({ createdAt: -1 });
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
router.post('/', requireAuth, requirePM, async (req, res) => {
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

    if (assignee) {
      const member = await TeamMember.findOne({
        $or: [{ name: assignee }, { email: assignee }],
        projectId: task.projectId
      });
      if (member) {
        await Notification.create({
          userEmail: member.email,
          projectId: task.projectId,
          type: 'TASK_ASSIGNMENT',
          message: `You have been assigned to a task: "${task.title}"`,
          link: `/kanban?taskId=${task._id}`,
        });
      }
    }

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

    // If assignee was updated and is not null, send notification
    if (body.assignee) {
      const member = await TeamMember.findOne({
        $or: [{ name: body.assignee }, { email: body.assignee }],
        projectId: task.projectId
      });
      if (member) {
        await Notification.create({
          userEmail: member.email,
          projectId: task.projectId,
          type: 'TASK_ASSIGNMENT',
          message: `You have been assigned to a task: "${task.title}"`,
          link: `/kanban?taskId=${task._id}`,
        });
      }
    }

    return res.status(200).json({ task });
  } catch (err) {
    console.error('[PATCH /api/tasks/:id]', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────
// Hard-deletes a task and all its subtasks.
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

    // Cascade: delete all subtasks belonging to this parent
    await Task.deleteMany({ parentTaskId: id });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ─── POST /api/tasks/:id/comments ────────────────────────────────
// Adds a comment to a task and triggers notifications.
// Required body: text, userName
// Auth: required.
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userName } = req.body;
    const userId = req.auth.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task id format' });
    }
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text is required' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newComment = {
      userId,
      userName: userName || 'User',
      text: text.trim(),
      createdAt: new Date(),
    };

    task.comments.push(newComment);
    await task.save();

    // Notification Logic
    const { Project } = await import('../models/project.model.js');
    const project = await Project.findById(task.projectId);
    
    if (project) {
      const isOwner = project.createdBy === userId;

      // If PM commented, notify developer (assignee)
      if (isOwner && task.assignee) {
        const member = await TeamMember.findOne({
          $or: [{ name: task.assignee }, { email: task.assignee }],
          projectId: task.projectId
        });
        if (member) {
          await Notification.create({
            userEmail: member.email,
            projectId: task.projectId,
            type: 'TASK_COMMENT',
            message: `PM commented on your task "${task.title}": ${text.substring(0, 50)}...`,
            link: `/kanban?taskId=${task._id}`,
          });
        }
      }

      // If developer commented, notify PM
      if (!isOwner) {
        try {
          const pmClerkUser = await getClerk().users.getUser(project.createdBy);
          const pmEmail = pmClerkUser.emailAddresses.find(
            (e) => e.id === pmClerkUser.primaryEmailAddressId
          )?.emailAddress;

          if (pmEmail) {
            await Notification.create({
              userEmail: pmEmail,
              projectId: task.projectId,
              type: 'TASK_COMMENT',
              message: `New comment from ${userName} on task "${task.title}": ${text.substring(0, 50)}...`,
              link: `/kanban?taskId=${task._id}`,
            });
          }
        } catch (clerkErr) {
          console.error('Failed to get PM email:', clerkErr.message);
        }
      }
    }

    return res.status(201).json({ task });
  } catch (err) {
    console.error('[POST /api/tasks/:id/comments]', err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
