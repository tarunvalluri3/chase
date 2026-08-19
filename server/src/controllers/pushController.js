import { getAuth } from '../middleware/auth.js';
import * as usersService from '../services/usersService.js';
import * as pushSubscriptionsService from '../services/pushSubscriptionsService.js';

async function currentInternalUserId(req) {
  const { userId: clerkUserId } = getAuth(req);
  const user = await usersService.getOrCreateUser(clerkUserId);
  return user.id;
}

export async function subscribe(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    await pushSubscriptionsService.subscribe(userId, req.body);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    await pushSubscriptionsService.unsubscribe(userId, req.body.endpoint);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export function vapidPublicKey(req, res, next) {
  try {
    res.status(200).json({ publicKey: pushSubscriptionsService.getVapidPublicKey() });
  } catch (err) {
    next(err);
  }
}
