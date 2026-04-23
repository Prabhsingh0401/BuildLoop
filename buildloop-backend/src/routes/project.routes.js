import { Router } from 'express';
import { createProject, getProjects, getProjectById, deleteProject } from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.delete('/:id', requireAuth, deleteProject);

export default router;
