import { createClerkClient, verifyToken } from '@clerk/backend';
import { Project } from '../models/project.model.js';

let clerk = null;

const getClerkClient = () => {
  if (!clerk) {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error('Missing CLERK_SECRET_KEY environment variable');
    }
    clerk = createClerkClient({ secretKey: clerkSecretKey });
  }
  return clerk;
};

/**
 * Middleware to verify Clerk Bearer token from Authorization header
 * Attaches userId to req.auth
 */
export const verifyClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token || token === 'undefined' || token === 'null') {
      // Allow requests without auth header to proceed (protect specific routes with requireAuth)
      req.auth = null;
      return next();
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    // Verify the token with Clerk
    const decoded = await verifyToken(token, { secretKey: clerkSecretKey, clockSkewInMs: 60000 });

    // Attach userId to request object
    req.auth = {
      userId: decoded.sub,
      sessionId: decoded.sid,
      orgId: decoded.org_id || null
    };

    next();
  } catch (error) {
    // Don't fail on auth error - let individual routes decide
    req.auth = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Should be used after verifyClerkAuth
 */
export const requireAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

/**
 * Middleware to require project-manager (owner) role.
 * Must be used after requireAuth.
 * Resolves projectId from (in priority order):
 *   req.body.projectId → req.params.projectId → req.query.projectId
 * For feature-scoped routes (e.g. /api/features/:id/task) where the projectId
 * lives on the Feature document, pass { fromFeature: true } as options.
 */
export const requirePM = (req, res, next) => {
  const projectId =
    req.body?.projectId ||
    req.params?.projectId ||
    req.query?.projectId;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'projectId is required for this action',
    });
  }

  Project.findById(projectId)
    .then((project) => {
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      if (project.createdBy !== req.auth.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the project owner can perform this action',
        });
      }
      next();
    })
    .catch(next);
};

/**
 * Middleware factory to require PM role for feature-scoped routes where the
 * feature document holds the projectId (e.g. POST /api/features/:id/task).
 * Usage: router.post('/:id/task', requireAuth, requirePMForFeature(Feature), handler)
 */
export const requirePMForFeature = (FeatureModel) => async (req, res, next) => {
  try {
    const featureId = req.params.id;

    if (!featureId) {
      return res.status(400).json({ success: false, message: 'Feature id is required' });
    }

    const feature = await FeatureModel.findById(featureId);
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }

    const project = await Project.findById(feature.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy !== req.auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can perform this action',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware factory to require PM role for task-scoped routes where the task
 * document holds the projectId (e.g. POST /api/tasks/:id/subtasks).
 * Usage: router.post('/:id/subtasks', requireAuth, requirePMForTask(Task), handler)
 */
export const requirePMForTask = (TaskModel) => async (req, res, next) => {
  try {
    const taskId = req.params.id;

    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy !== req.auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can perform this action',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
