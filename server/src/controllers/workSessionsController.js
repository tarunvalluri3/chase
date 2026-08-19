import { getAuth } from '../middleware/auth.js';
import * as usersService from '../services/usersService.js';
import * as workSessionsService from '../services/workSessionsService.js';

async function currentInternalUserId(req) {
  const { userId: clerkUserId } = getAuth(req);
  const user = await usersService.getOrCreateUser(clerkUserId);
  return user.id;
}

export async function start(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const session = await workSessionsService.startSession(userId, req.params.id);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function pause(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const session = await workSessionsService.pauseSession(userId, req.params.id);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function resume(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const session = await workSessionsService.resumeSession(userId, req.params.id);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function stop(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const session = await workSessionsService.stopSession(userId, req.params.id);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const sessions = await workSessionsService.listSessions(userId, req.params.id);
    res.status(200).json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const result = await workSessionsService.getSummary(userId, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
