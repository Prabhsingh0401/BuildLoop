import { Project } from '../models/project.model.js';
import AppError from '../utils/AppError.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!name) {
      throw new AppError('Project name is required', 400);
    }

    const project = new Project({
      name,
      description,
      createdBy: userId,
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const projects = await Project.find({ createdBy: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects,
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

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};
