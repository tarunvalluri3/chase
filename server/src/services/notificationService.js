import * as notificationsRepository from '../repositories/notificationsRepository.js';
import * as usersRepository from '../repositories/usersRepository.js';
import * as tasksRepository from '../repositories/tasksRepository.js';
import * as pushSubscriptionsRepository from '../repositories/pushSubscriptionsRepository.js';
import * as notificationsFeedRepository from '../repositories/notificationsFeedRepository.js';
import { sendEmail } from './emailService.js';
import { sendPush } from './pushService.js';
import { buildEmail, buildPush } from './notificationTemplates.js';

const MAX_ATTEMPTS = 5;

// Fans a single event out to three independent channels -- email (Phase
// 17), push, and the always-on in-app feed (both Phase 18). Each channel's
// own failure is caught and logged at its own boundary, so one channel
// failing (no push subscriptions, a rejected web-push send, a feed-insert
// error) never affects the others, and none of them can ever propagate back
// into the tasksService method that triggered this call.
async function dispatch(type, dedupKey, userId, task, extra = {}) {
  try {
    const user = await usersRepository.findById(userId);
    if (!user) {
      return;
    }

    await Promise.all([
      dispatchEmail(type, dedupKey, user, task, extra),
      dispatchPush(type, dedupKey, user, task, extra),
      dispatchFeed(type, user, task, extra),
    ]);
  } catch (err) {
    console.error('notificationService.dispatch failed', { type, taskId: task?.id, err });
  }
}

async function dispatchEmail(type, dedupKey, user, task, extra) {
  try {
    const claimed = await notificationsRepository.claim({
      userId: user.id,
      taskId: task.id,
      type,
      dedupKey,
      channel: 'EMAIL',
    });
    if (!claimed) {
      // Already sent (or currently being sent) by a prior attempt.
      return;
    }

    if (!user.email) {
      await notificationsRepository.markFailed(claimed.id, 'No email on file for user', MAX_ATTEMPTS);
      return;
    }

    await attemptSendEmail(claimed, user, task, type, extra);
  } catch (err) {
    console.error('notificationService.dispatchEmail failed', { type, taskId: task?.id, err });
  }
}

async function attemptSendEmail(row, user, task, type, extra) {
  try {
    const { subject, html, text } = buildEmail(type, { task, ...extra });
    await sendEmail({ to: user.email, subject, html, text });
    await notificationsRepository.markSent(row.id);
  } catch (err) {
    await notificationsRepository.markFailed(row.id, err.message ?? 'Send failed', (row.attempts ?? 0) + 1);
  }
}

async function dispatchPush(type, dedupKey, user, task, extra) {
  try {
    const subscriptions = await pushSubscriptionsRepository.listByUser(user.id);
    if (subscriptions.length === 0) {
      // No devices to push to -- no error, no log noise, matching how a
      // user with no email on file for the EMAIL channel above is also a
      // normal, expected case rather than a failure.
      return;
    }

    const claimed = await notificationsRepository.claim({
      userId: user.id,
      taskId: task.id,
      type,
      dedupKey,
      channel: 'PUSH',
    });
    if (!claimed) {
      return;
    }

    await attemptSendPush(claimed, subscriptions, task, type, extra);
  } catch (err) {
    console.error('notificationService.dispatchPush failed', { type, taskId: task?.id, err });
  }
}

// Sends to every one of the user's subscriptions (0..n devices) under one
// claimed notification_log row for this event -- the row tracks "has this
// event's push been attempted", not "did every single device receive it".
// sendPush itself never throws, so this only fails to mark SENT when every
// device it tried came back rejected.
async function attemptSendPush(row, subscriptions, task, type, extra) {
  try {
    const payload = buildPush(type, { task, ...extra });
    const results = await Promise.all(subscriptions.map((subscription) => sendPush(subscription, payload)));

    if (results.some((result) => result.ok)) {
      await notificationsRepository.markSent(row.id);
      return;
    }

    const firstError = results.find((result) => !result.ok)?.error;
    await notificationsRepository.markFailed(
      row.id,
      firstError?.message ?? 'Push send failed',
      (row.attempts ?? 0) + 1,
    );
  } catch (err) {
    await notificationsRepository.markFailed(row.id, err.message ?? 'Push send failed', (row.attempts ?? 0) + 1);
  }
}

// The in-app feed is always populated, regardless of email/push outcome --
// it's a durable record of what happened, not a delivery attempt, so there
// is no claim/dedup/retry step here, just a best-effort insert.
async function dispatchFeed(type, user, task, extra) {
  try {
    const { title, body } = buildPush(type, { task, ...extra });
    await notificationsFeedRepository.create({ userId: user.id, taskId: task.id, type, title, body });
  } catch (err) {
    console.error('notificationService.dispatchFeed failed', { type, taskId: task?.id, err });
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

// Re-attempts every FAILED send (either channel) under the attempt cap.
// Called by the scheduler; also exported for direct testing without a real
// timer.
export async function retryFailed() {
  const rows = await notificationsRepository.findRetryable(MAX_ATTEMPTS);

  for (const row of rows) {
    try {
      await retryRow(row);
    } catch (err) {
      console.error('notificationService.retryFailed: one row failed', { id: row.id, err });
    }
  }
}

async function retryRow(row) {
  const task = await tasksRepository.findByIdInternal(row.task_id);
  if (!task) {
    await notificationsRepository.markFailed(row.id, 'No longer retryable (missing task)', MAX_ATTEMPTS);
    return;
  }

  if (row.channel === 'PUSH') {
    const subscriptions = await pushSubscriptionsRepository.listByUser(row.user_id);
    if (subscriptions.length === 0) {
      await notificationsRepository.markFailed(row.id, 'No longer retryable (no subscriptions)', MAX_ATTEMPTS);
      return;
    }
    await attemptSendPush(row, subscriptions, task, row.type, {});
    return;
  }

  const user = await usersRepository.findById(row.user_id);
  if (!user?.email) {
    await notificationsRepository.markFailed(row.id, 'No longer retryable (missing user/email)', MAX_ATTEMPTS);
    return;
  }
  await attemptSendEmail(row, user, task, row.type, {});
}
