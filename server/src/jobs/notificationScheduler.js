import * as tasksRepository from '../repositories/tasksRepository.js';
import * as notificationService from '../services/notificationService.js';
import { MISSED_REASON } from '../services/tasksService.js';

function sweepIntervalMs() {
  const minutes = Number(process.env.NOTIFICATION_SWEEP_INTERVAL_MINUTES) || 5;
  return minutes * 60 * 1000;
}

function reminderWindow() {
  const hours = Number(process.env.DEADLINE_REMINDER_HOURS_BEFORE) || 24;
  return { hours, label: `${hours}h_before` };
}

// The one scheduled background pass this phase adds: flips overdue ACTIVE
// tasks to MISSED across every user (not just whoever happens to load the
// app), sends missed/reminder emails, and retries anything that failed to
// send last time. All state lives in notification_log, not memory, so a
// server restart just resumes from where the database says things are --
// nothing is lost and nothing double-sends.
export async function runNotificationSweep() {
  const now = new Date().toISOString();

  try {
    const newlyMissed = await tasksRepository.sweepAllUsersMissed({ missedReason: MISSED_REASON, now });
    await Promise.all(newlyMissed.map((task) => notificationService.notifyTaskMissed(task)));
  } catch (err) {
    console.error('notificationScheduler: missed sweep failed', err);
  }

  try {
    const { hours, label } = reminderWindow();
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const dueSoon = await tasksRepository.findActiveDueWithin({ now, until });
    await Promise.all(dueSoon.map((task) => notificationService.notifyDeadlineReminder(task, label)));
  } catch (err) {
    console.error('notificationScheduler: reminder pass failed', err);
  }

  try {
    await notificationService.retryFailed();
  } catch (err) {
    console.error('notificationScheduler: retry pass failed', err);
  }
}

export function startNotificationScheduler() {
  const intervalMs = sweepIntervalMs();

  // Run once shortly after boot, then on the regular interval.
  setTimeout(() => runNotificationSweep(), 10_000);
  const timer = setInterval(() => runNotificationSweep(), intervalMs);

  return () => clearInterval(timer);
}
