import * as tasksRepository from '../repositories/tasksRepository.js';
import * as notificationService from './notificationService.js';
import * as workSessionsService from './workSessionsService.js';
import { NotFoundError, InvalidTransitionError } from '../errors/AppError.js';

export const MISSED_REASON = 'Deadline passed while task was still ACTIVE';

// Shared single-source-of-truth for "what counts as missed": an ACTIVE task
// whose deadline has already passed. Used by both the lazy read-path check
// and the bulk sweep.
async function maybeTransitionToMissed(task) {
  if (task.status !== 'ACTIVE' || new Date(task.deadline) >= new Date()) {
    return task;
  }

  const now = new Date().toISOString();

  const updated = await tasksRepository.transitionToMissedIfActive(task.id, task.user_id, {
    status: 'MISSED',
    missed_reason: MISSED_REASON,
    missed_at: now,
    updated_at: now,
  });

  if (!updated) {
    // Status changed out from under us between the read and this write
    // (e.g. a concurrent Complete/Delete landed first) -- return the
    // current row rather than the now-stale in-memory `task`.
    return tasksRepository.findByIdForUser(task.id, task.user_id);
  }

  await workSessionsService.autoCloseOpenSession(task.id);

  return updated;
}

async function getOwnedTaskOrThrow(id, userId) {
  const task = await tasksRepository.findByIdForUser(id, userId);

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return task;
}

export async function createTask(userId, { title, description, deadline, priority }) {
  const task = await tasksRepository.create(userId, {
    title,
    description: description ?? null,
    deadline,
    priority,
  });

  await notificationService.notifyTaskCreated(userId, task);

  return task;
}

export async function listTasks(userId, status) {
  // Fetch unfiltered so tasks that are about to transition (ACTIVE -> MISSED)
  // are included and re-filtered post-transition, rather than filtered on
  // their stale pre-transition status.
  const tasks = await tasksRepository.listByUser(userId, {});
  const transitioned = await Promise.all(tasks.map(maybeTransitionToMissed));

  return status ? transitioned.filter((task) => task.status === status) : transitioned;
}

export async function getTask(userId, id) {
  const task = await getOwnedTaskOrThrow(id, userId);
  return maybeTransitionToMissed(task);
}

export async function sweepMissedTasks(userId) {
  return tasksRepository.sweepMissed(userId, {
    missedReason: MISSED_REASON,
    now: new Date().toISOString(),
  });
}

export async function resolveMissedTask(userId, id, resolution, reason) {
  const task = await getTask(userId, id);

  if (task.status !== 'MISSED') {
    throw new InvalidTransitionError('Only MISSED tasks can be resolved');
  }

  const now = new Date().toISOString();

  if (resolution === 'INCOMPLETE') {
    const updated = await tasksRepository.update(id, userId, {
      status: 'INCOMPLETE',
      incomplete_reason: reason,
      incomplete_at: now,
      updated_at: now,
    });
    await notificationService.notifyTaskIncomplete(userId, updated);
    return updated;
  }

  const updated = await tasksRepository.update(id, userId, {
    status: 'COMPLETED',
    completed_at: now,
    updated_at: now,
  });
  await notificationService.notifyTaskCompleted(userId, updated);
  return updated;
}

export async function editTask(userId, id, fields) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be edited');
  }

  const updated = await tasksRepository.update(id, userId, {
    ...fields,
    updated_at: new Date().toISOString(),
  });

  const changedFields = ['deadline', 'priority'].filter((field) => {
    if (!(field in fields)) {
      return false;
    }
    if (field === 'deadline') {
      return new Date(fields.deadline).getTime() !== new Date(task.deadline).getTime();
    }
    return fields[field] !== task[field];
  });
  if (changedFields.length > 0) {
    await notificationService.notifyTaskUpdated(userId, updated, changedFields);
  }

  return updated;
}

export async function completeTask(userId, id) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be completed');
  }

  const now = new Date().toISOString();

  const updated = await tasksRepository.update(id, userId, {
    status: 'COMPLETED',
    completed_at: now,
    updated_at: now,
  });
  await workSessionsService.autoCloseOpenSession(id);
  await notificationService.notifyTaskCompleted(userId, updated);
  return updated;
}

export async function deleteTask(userId, id, reason) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be deleted');
  }

  const now = new Date().toISOString();

  const updated = await tasksRepository.update(id, userId, {
    status: 'DELETED',
    deletion_reason: reason,
    deleted_at: now,
    updated_at: now,
  });
  await workSessionsService.autoCloseOpenSession(id);
  await notificationService.notifyTaskDeleted(userId, updated);
  return updated;
}
