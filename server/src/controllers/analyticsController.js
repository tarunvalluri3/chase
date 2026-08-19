import { getAuth } from '../middleware/auth.js';
import * as usersService from '../services/usersService.js';
import * as analyticsService from '../services/analyticsService.js';

export async function summary(req, res, next) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    const user = await usersService.getOrCreateUser(clerkUserId);
    const result = await analyticsService.getSummary(user.id, req.query.range);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
