import { Notification } from '../models/notification.model.js';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function getUserEmail(req) {
  let email = req.auth.claims?.email_addresses?.[0] || req.auth.claims?.email || req.auth.claims?.primary_email_address || req.auth.claims?.email_address;
  if (!email && req.auth.userId) {
    const user = await clerkClient.users.getUser(req.auth.userId);
    email = user.emailAddresses[0]?.emailAddress;
  }
  return email;
}

export async function getUserNotifications(req, res, next) {
  try {
    const userEmail = await getUserEmail(req);
    if (!userEmail) return res.status(400).json({ success: false, message: 'Email not found in token or user profile' });

    const notifications = await Notification.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ userEmail, isRead: false });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const userEmail = await getUserEmail(req);
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userEmail },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const userEmail = await getUserEmail(req);

    await Notification.updateMany(
      { userEmail, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}
