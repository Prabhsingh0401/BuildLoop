import { Project } from '../models/project.model.js';
import { TeamMember } from '../models/teamMember.model.js';
import AppError from '../utils/AppError.js';
import { createClerkClient } from '@clerk/backend';

let clerk = null;
const getClerk = () => {
  if (!clerk) clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  return clerk;
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.auth?.userId;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!name) throw new AppError('Project name is required', 400);

    const project = new Project({ name, description, createdBy: userId });
    await project.save();

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    // 1. Projects this user created (PM view)
    const ownedProjects = await Project.find({ createdBy: userId }).sort({ createdAt: -1 });

    // 2. Projects this user was added to as a developer
    //    Requires knowing their primary email — look it up via Clerk backend SDK
    let assignedProjects = [];
    try {
      const clerkUser = await getClerk().users.getUser(userId);
      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      if (primaryEmail) {
        // Find all teamMember records for this email
        const memberships = await TeamMember.find({ email: primaryEmail.toLowerCase() });
        const assignedProjectIds = memberships.map((m) => m.projectId);

        if (assignedProjectIds.length > 0) {
          // Fetch those projects (excluding ones the user already owns)
          const ownedIds = ownedProjects.map((p) => p._id.toString());
          const uniqueAssignedIds = assignedProjectIds.filter((id) => !ownedIds.includes(id));

          if (uniqueAssignedIds.length > 0) {
            assignedProjects = await Project.find({
              _id: { $in: uniqueAssignedIds },
            }).sort({ createdAt: -1 });

            // Tag assigned projects so the frontend knows the user is a developer on them
            assignedProjects = assignedProjects.map((p) => ({
              ...p.toObject(),
              role: memberships.find((m) => m.projectId === p._id.toString())?.role || 'Developer',
              isAssigned: true,
            }));
          }
        }
      }
    } catch (clerkErr) {
      // If Clerk lookup fails, just return owned projects — don't crash
      console.error('Clerk user lookup failed:', clerkErr.message);
    }

    // Merge: owned first, then assigned (with isOwner flag and members for the frontend)
    const ownedWithFlag = ownedProjects.map((p) => ({
      ...p.toObject(),
      isOwner: true,
      isAssigned: false,
    }));

    // Helper to get members for a project
    const getProjectMembers = async (projectId) => {
      return await TeamMember.find({ projectId }).sort({ createdAt: 1 });
    };

    const projectsWithMembers = await Promise.all(
      [...ownedWithFlag, ...assignedProjects].map(async (p) => {
        const members = await getProjectMembers(p._id.toString());
        return { ...p, members };
      })
    );

    res.status(200).json({
      success: true,
      data: projectsWithMembers,
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;

    const project = await Project.findOne({ _id: id, createdBy: userId });
    if (!project) throw new AppError('Project not found', 404);

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    // Only the owner can delete
    const project = await Project.findOne({ _id: id, createdBy: userId });
    if (!project) throw new AppError('Project not found or not authorized', 404);

    // Hard-delete all associated data
    const { Task } = await import('../models/task.model.js');
    const { Feedback } = await import('../models/feedback.model.js');
    const { Insight } = await import('../models/insight.model.js');
    const { Feature } = await import('../models/feature.model.js');

    await Promise.all([
      Task.deleteMany({ projectId: id }),
      Feedback.deleteMany({ projectId: id }),
      Insight.deleteMany({ projectId: id }),
      Feature.deleteMany({ projectId: id }),
      TeamMember.deleteMany({ projectId: id }),
    ]);

    await Project.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.auth?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    if (!name || !name.trim()) throw new AppError('Project name is required', 400);

    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { name: name.trim() },
      { returnDocument: 'after' }
    );

    if (!project) throw new AppError('Project not found or not authorized', 404);

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};
