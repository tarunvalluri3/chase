import * as tasksRepository from '../repositories/tasksRepository.js';
import { NotFoundError, InvalidTransitionError } from '../errors/AppError.js';

const MISSED_REASON = 'Deadline passed while task was still ACTIVE';

// Shared single-source-of-truth for "what counts as missed": an ACTIVE task
// whose deadline has already passed. Used by both the lazy read-path check
// and the bulk sweep.
async function maybeTransitionToMissed(task) {
  if (task.status !== 'ACTIVE' || new Date(task.deadline) >= new Date()) {
    return task;
  }

  const now = new Date().toISOString();

  return tasksRepository.update(task.id, task.user_id, {
    status: 'MISSED',
    missed_reason: MISSED_REASON,
    missed_at: now,
    updated_at: now,
  });
}

async function getOwnedTaskOrThrow(id, userId) {
  const task = await tasksRepository.findByIdForUser(id, userId);

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return task;
}

export async function createTask(userId, { title, description, deadline, priority }) {
  return tasksRepository.create(userId, {
    title,
    description: description ?? null,
    deadline,
    priority,
  });
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
    return tasksRepository.update(id, userId, {
      status: 'INCOMPLETE',
      incomplete_reason: reason,
      incomplete_at: now,
      updated_at: now,
    });
  }

  return tasksRepository.update(id, userId, {
    status: 'COMPLETED',
    completed_at: now,
    updated_at: now,
  });
}

export async function editTask(userId, id, fields) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be edited');
  }

  return tasksRepository.update(id, userId, {
    ...fields,
    updated_at: new Date().toISOString(),
  });
}

export async function completeTask(userId, id) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be completed');
  }

  const now = new Date().toISOString();

  return tasksRepository.update(id, userId, {
    status: 'COMPLETED',
    completed_at: now,
    updated_at: now,
  });
}

export async function deleteTask(userId, id, reason) {
  const task = await getOwnedTaskOrThrow(id, userId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can be deleted');
  }

  const now = new Date().toISOString();

  return tasksRepository.update(id, userId, {
    status: 'DELETED',
    deletion_reason: reason,
    deleted_at: now,
    updated_at: now,
  });
}
