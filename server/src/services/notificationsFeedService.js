import * as notificationsFeedRepository from '../repositories/notificationsFeedRepository.js';
import { NotFoundError } from '../errors/AppError.js';

export async function listFeed(userId, { unreadOnly } = {}) {
  return notificationsFeedRepository.listByUser(userId, { unreadOnly });
}

export async function markRead(userId, id) {
  const updated = await notificationsFeedRepository.markRead(id, userId);
  if (!updated) {
    throw new NotFoundError('Notification not found');
  }
  return updated;
}

export async function markAllRead(userId) {
  await notificationsFeedRepository.markAllRead(userId);
}
