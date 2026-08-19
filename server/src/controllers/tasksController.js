import { getAuth } from '../middleware/auth.js';
import * as usersService from '../services/usersService.js';
import * as tasksService from '../services/tasksService.js';

async function currentInternalUserId(req) {
  const { userId: clerkUserId } = getAuth(req);
  const user = await usersService.getOrCreateUser(clerkUserId);
  return user.id;
}

export async function create(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const task = await tasksService.createTask(userId, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const tasks = await tasksService.listTasks(userId, req.query.status);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const task = await tasksService.getTask(userId, req.params.id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function edit(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const task = await tasksService.editTask(userId, req.params.id, req.body);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function complete(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const task = await tasksService.completeTask(userId, req.params.id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const task = await tasksService.deleteTask(userId, req.params.id, req.body.reason);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function resolveMissed(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const { resolution, reason } = req.body;
    const task = await tasksService.resolveMissedTask(userId, req.params.id, resolution, reason);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function sweep(req, res, next) {
  try {
    const userId = await currentInternalUserId(req);
    const tasks = await tasksService.sweepMissedTasks(userId);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}
