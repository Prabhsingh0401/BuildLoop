import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getUserNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
