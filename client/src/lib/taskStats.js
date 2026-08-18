// Client-side aggregation over the full unfiltered task list (DESIGN.md §7,
// Phase 14) — no new backend aggregation endpoint, per the phase's explicit
// "keep it simple" scope. Everything here is a pure function over the array
// useDashboardTasks already fetched.

export const STATUS_ORDER = ['ACTIVE', 'MISSED', 'COMPLETED', 'INCOMPLETE', 'DELETED'];

const EMPTY_COUNTS = { ACTIVE: 0, MISSED: 0, COMPLETED: 0, INCOMPLETE: 0, DELETED: 0 };

export function computeStatusCounts(tasks) {
  const counts = { ...EMPTY_COUNTS };
  for (const task of tasks) {
    if (task.status in counts) counts[task.status] += 1;
  }
  return counts;
}

const EVENT_META = {
  ACTIVE: { verb: 'Created', timestampKey: 'created_at' },
  COMPLETED: { verb: 'Completed', timestampKey: 'completed_at' },
  MISSED: { verb: 'Needs review', timestampKey: 'missed_at' },
  INCOMPLETE: { verb: 'Marked not done', timestampKey: 'incomplete_at' },
  DELETED: { verb: 'Deleted', timestampKey: 'deleted_at' },
};

// One entry per task — the event tied to its current status — sorted
// most-recent-first. Falls back to created_at if a status-specific
// timestamp is somehow unset, so a task can never be silently dropped.
export function computeRecentActivity(tasks, limit = 5) {
  return tasks
    .map((task) => {
      const meta = EVENT_META[task.status] ?? EVENT_META.ACTIVE;
      const timestamp = task[meta.timestampKey] ?? task.created_at;
      return { task, verb: meta.verb, timestamp };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

// Active tasks whose deadline is still ahead but within the next 24h.
// Overdue ACTIVE tasks don't apply here: the unfiltered GET /api/tasks that
// feeds this already lazily transitions them to MISSED server-side
// (CLAUDE.md's automatic-missed-detection rule) before this ever runs.
export function computeDueSoon(tasks, { now = new Date(), limit = 3 } = {}) {
  const nowMs = now.getTime();
  return tasks
    .filter((task) => task.status === 'ACTIVE')
    .filter((task) => {
      const deadlineMs = new Date(task.deadline).getTime();
      return deadlineMs >= nowMs && deadlineMs - nowMs <= DUE_SOON_WINDOW_MS;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, limit);
}
