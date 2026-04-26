import { Router } from 'express';
import {
  addTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/teamMember.controller.js';

const router = Router();

// All routes are fully protected (requireAuth applied globally in index.js)
router.get('/', getTeamMembers);
router.post('/', addTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
