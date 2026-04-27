import { TeamMember } from '../models/teamMember.model.js';
import { Notification } from '../models/notification.model.js';
import AppError from '../utils/AppError.js';

/**
 * POST /api/team-members
 * PM adds a member to a specific project.
 * Body: { email, role, name, projectId }
 */
export const addTeamMember = async (req, res, next) => {
  try {
    const { email, role, name, projectId } = req.body;
    const addedBy = req.auth?.userId;

    if (!addedBy) throw new AppError('Unauthorized', 401);
    if (!email) throw new AppError('Email is required', 400);
    if (!role) throw new AppError('Role is required', 400);
    if (!projectId) throw new AppError('Project ID is required', 400);

    // Synchronize indexes with the schema to drop any legacy unique indexes
    // that might be restricting adding members across different projects
    try {
      await TeamMember.syncIndexes();
    } catch (e) {
      console.warn('Failed to sync indexes:', e);
    }

    const member = new TeamMember({
      email: email.toLowerCase(),
      role,
      name: name || '',
      addedBy,
      projectId,
    });
    await member.save();

    // Create Notification
    await Notification.create({
      userEmail: email.toLowerCase(),
      projectId,
      type: 'PROJECT_ASSIGNMENT',
      message: `You have been added to a new project as a ${role}.`,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('This member is already assigned to this project', 409));
    }
    next(err);
  }
};

/**
 * GET /api/team-members?projectId=xxx
 * List all members assigned to a specific project by the calling PM.
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const addedBy = req.auth?.userId;
    if (!addedBy) throw new AppError('Unauthorized', 401);
    if (!projectId) throw new AppError('Project ID is required', 400);

    const members = await TeamMember.find({ addedBy, projectId }).sort({ createdAt: -1 });
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/team-members/:id
 * Update a team member's role or name.
 */
export const updateTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, name } = req.body;
    const addedBy = req.auth?.userId;
    if (!addedBy) throw new AppError('Unauthorized', 401);

    const member = await TeamMember.findOneAndUpdate(
      { _id: id, addedBy },
      { role, name },
      { returnDocument: 'after', runValidators: true }
    );

    if (!member) throw new AppError('Team member not found', 404);

    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/team-members/:id
 * Remove a team member from a project.
 */
export const deleteTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const addedBy = req.auth?.userId;
    if (!addedBy) throw new AppError('Unauthorized', 401);

    const member = await TeamMember.findOneAndDelete({ _id: id, addedBy });
    if (!member) throw new AppError('Team member not found', 404);

    res.json({ success: true, message: 'Team member removed' });
  } catch (err) {
    next(err);
  }
};
