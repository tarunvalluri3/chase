import { getAuth } from '../middleware/auth.js';
import * as usersService from '../services/usersService.js';
import * as notificationsFeedService from '../services/notificationsFeedService.js';

async function currentInternalUserId(req) {
  const { userId: clerkUserId } = getAuth(req);
  const user = await usersService.getOrCreateUser(clerkUserId);
  return user.id;
}

export async function list(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const notifications = await notificationsFeedService.listFeed(userId, {
      unreadOnly: req.query.unreadOnly,
    });
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const notification = await notificationsFeedService.markRead(userId, req.params.id);
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    await notificationsFeedService.markAllRead(userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
