import * as notificationsRepository from '../repositories/notificationsRepository.js';
import * as usersRepository from '../repositories/usersRepository.js';
import * as tasksRepository from '../repositories/tasksRepository.js';
import { sendEmail } from './emailService.js';
import { buildEmail } from './notificationTemplates.js';

const MAX_ATTEMPTS = 5;

// Sends one notification, unless it's already been claimed/sent for this
// (task, type, dedup key) combination. Never throws -- every failure mode
// (no user, no email on file, a rejected Resend call, a DB error) is
// caught, logged, and recorded in notification_log instead of propagating,
// so a caller in the middle of a task operation can call this without any
// further try/catch of its own.
async function dispatch(type, dedupKey, userId, task, extra = {}) {
  try {
    const user = await usersRepository.findById(userId);
    if (!user) {
      return;
    }

    const claimed = await notificationsRepository.claim({
      userId,
      taskId: task.id,
      type,
      dedupKey,
    });
    if (!claimed) {
      // Already sent (or currently being sent) by a prior attempt.
      return;
    }

    if (!user.email) {
      await notificationsRepository.markFailed(claimed.id, 'No email on file for user', MAX_ATTEMPTS);
      return;
    }

    await attemptSend(claimed, user, task, type, extra);
  } catch (err) {
    console.error('notificationService.dispatch failed', { type, taskId: task?.id, err });
  }
}

async function attemptSend(row, user, task, type, extra) {
  try {
    const { subject, html, text } = buildEmail(type, { task, ...extra });
    await sendEmail({ to: user.email, subject, html, text });
    await notificationsRepository.markSent(row.id);
  } catch (err) {
    await notificationsRepository.markFailed(row.id, err.message ?? 'Send failed', (row.attempts ?? 0) + 1);
  }
}

export const notifyTaskCreated = (userId, task) => dispatch('TASK_CREATED', 'once', userId, task);

export const notifyTaskCompleted = (userId, task) =>
  dispatch('TASK_COMPLETED', 'once', userId, task);

export const notifyTaskIncomplete = (userId, task) =>
  dispatch('TASK_INCOMPLETE', 'once', userId, task);

export const notifyTaskDeleted = (userId, task) => dispatch('TASK_DELETED', 'once', userId, task);

export const notifyTaskUpdated = (userId, task, changedFields) =>
  dispatch('TASK_UPDATED', task.updated_at, userId, task, { changedFields });

export const notifyTaskMissed = (task) => dispatch('TASK_MISSED', 'once', task.user_id, task);

export const notifyDeadlineReminder = (task, windowLabel) =>
  dispatch('DEADLINE_REMINDER', windowLabel, task.user_id, task, { windowLabel });

// Re-attempts every FAILED send under the attempt cap. Called by the
// scheduler; also exported for direct testing without a real timer.
export async function retryFailed() {
  const rows = await notificationsRepository.findRetryable(MAX_ATTEMPTS);

  for (const row of rows) {
    try {
      const [user, task] = await Promise.all([
        usersRepository.findById(row.user_id),
        tasksRepository.findByIdInternal(row.task_id),
      ]);

      if (!user?.email || !task) {
        await notificationsRepository.markFailed(row.id, 'No longer retryable (missing user/email/task)', MAX_ATTEMPTS);
        continue;
      }

      await attemptSend(row, user, task, row.type, {});
    } catch (err) {
      console.error('notificationService.retryFailed: one row failed', { id: row.id, err });
    }
  }
}
