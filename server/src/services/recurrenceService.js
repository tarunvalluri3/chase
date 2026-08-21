import * as tasksRepository from '../repositories/tasksRepository.js';
import * as notificationService from './notificationService.js';

// Advances a UTC deadline by one calendar step of the given repeat rule.
// Anchored to the completed task's *original* deadline (not the moment it
// was actually completed), so a recurring task stays pinned to its cadence
// (e.g. "every Monday") regardless of how early or late it was completed.
function advanceDeadline(deadline, repeatRule) {
  const next = new Date(deadline);

  if (repeatRule === 'DAILY') {
    next.setUTCDate(next.getUTCDate() + 1);
  } else if (repeatRule === 'WEEKLY') {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (repeatRule === 'MONTHLY') {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }

  return next.toISOString();
}

// Side effect appended after a task's ACTIVE->COMPLETED or
// MISSED->COMPLETED write commits. Never touches the state machine itself
// and never lets its own failure block the response that triggered it --
// same isolation pattern as notificationService.dispatch.
export async function maybeSpawnNextOccurrence(userId, completedTask) {
  try {
    if (!completedTask.repeat_rule || completedTask.repeat_rule === 'NONE') {
      return;
    }

    const spawned = await tasksRepository.create(userId, {
      title: completedTask.title,
      description: completedTask.description,
      deadline: advanceDeadline(completedTask.deadline, completedTask.repeat_rule),
      priority: completedTask.priority,
      reminder_enabled: completedTask.reminder_enabled,
      repeat_rule: completedTask.repeat_rule,
      repeat_group_id: completedTask.repeat_group_id,
    });

    await notificationService.notifyTaskCreated(userId, spawned);
  } catch (err) {
    console.error('recurrenceService.maybeSpawnNextOccurrence failed', {
      taskId: completedTask?.id,
      err,
    });
  }
}
