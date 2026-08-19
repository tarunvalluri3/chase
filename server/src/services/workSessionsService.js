import * as workSessionsRepository from '../repositories/workSessionsRepository.js';
import * as tasksService from './tasksService.js';
import { InvalidTransitionError } from '../errors/AppError.js';

// Ownership check + lazy ACTIVE->MISSED transition, reused from tasksService
// so "the deadline already passed" is caught the same way here as it is on
// every other task read (throws NotFoundError for a foreign/nonexistent id).
async function getOwnedTask(userId, taskId) {
  return tasksService.getTask(userId, taskId);
}

// The partial unique index (work_sessions_one_open_per_task) is the actual
// invalid-state guard at the database level; a race between two concurrent
// Start/Resume calls surfaces here as a Postgres unique violation (23505),
// which we map onto the same 409 the pre-check below already produces.
async function createSegment(taskId, userId) {
  try {
    return await workSessionsRepository.create(taskId, userId);
  } catch (err) {
    if (err?.code === '23505') {
      throw new InvalidTransitionError('A work session is already running for this task');
    }
    throw err;
  }
}

export async function startSession(userId, taskId) {
  const task = await getOwnedTask(userId, taskId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can start a work session');
  }

  const open = await workSessionsRepository.findOpenForTask(taskId);
  if (open) {
    throw new InvalidTransitionError('A work session is already running for this task');
  }

  return createSegment(taskId, userId);
}

export async function pauseSession(userId, taskId) {
  await getOwnedTask(userId, taskId);

  const open = await workSessionsRepository.findOpenForTask(taskId);
  if (!open) {
    throw new InvalidTransitionError('No running work session to pause');
  }

  return workSessionsRepository.close(open.id, 'PAUSED', new Date().toISOString());
}

export async function resumeSession(userId, taskId) {
  const task = await getOwnedTask(userId, taskId);

  if (task.status !== 'ACTIVE') {
    throw new InvalidTransitionError('Only ACTIVE tasks can resume a work session');
  }

  const open = await workSessionsRepository.findOpenForTask(taskId);
  if (open) {
    throw new InvalidTransitionError('A work session is already running for this task');
  }

  const mostRecent = await workSessionsRepository.findMostRecentForTask(taskId);
  if (!mostRecent || mostRecent.end_reason !== 'PAUSED') {
    throw new InvalidTransitionError('Only a paused work session can be resumed');
  }

  return createSegment(taskId, userId);
}

export async function stopSession(userId, taskId) {
  await getOwnedTask(userId, taskId);

  const open = await workSessionsRepository.findOpenForTask(taskId);
  if (!open) {
    throw new InvalidTransitionError('No running work session to stop');
  }

  return workSessionsRepository.close(open.id, 'STOPPED', new Date().toISOString());
}

export async function listSessions(userId, taskId) {
  await getOwnedTask(userId, taskId);
  return workSessionsRepository.listByTask(taskId);
}

export async function getSummary(userId, taskId) {
  await getOwnedTask(userId, taskId);
  const sessions = await workSessionsRepository.listByTask(taskId);

  const now = Date.now();
  let totalMs = 0;
  let isRunning = false;
  let currentSessionStartedAt = null;

  for (const session of sessions) {
    const startedAtMs = new Date(session.started_at).getTime();
    if (session.ended_at) {
      totalMs += new Date(session.ended_at).getTime() - startedAtMs;
    } else {
      totalMs += now - startedAtMs;
      isRunning = true;
      currentSessionStartedAt = session.started_at;
    }
  }

  return {
    totalSeconds: Math.floor(totalMs / 1000),
    isRunning,
    currentSessionStartedAt,
  };
}

// Called by tasksService whenever a task leaves ACTIVE (Complete, Delete, or
// the lazy/scheduled ACTIVE->MISSED transition) so a RUNNING session never
// keeps counting elapsed time against a task nobody can work on anymore.
// A no-op when there's no open segment.
export async function autoCloseOpenSession(taskId) {
  const open = await workSessionsRepository.findOpenForTask(taskId);
  if (!open) {
    return null;
  }

  return workSessionsRepository.close(open.id, 'AUTO_STOPPED', new Date().toISOString());
}
