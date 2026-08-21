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

// DESIGN.md §8 — Profile's ledger strip (Completed count, on-time rate).
// "On time" means completed without ever having passed through MISSED
// first (missed_at unset) — the same distinction the completion trend chart
// draws (server-side, Phase 20's analyticsService.js), restated here as a
// single all-time percentage rather than a weekly trend.
export function computeCompletedCount(tasks) {
  return tasks.filter((task) => task.status === 'COMPLETED').length;
}

export function computeOnTimeRate(tasks) {
  const completed = tasks.filter((task) => task.status === 'COMPLETED');
  if (completed.length === 0) return null;
  const onTime = completed.filter((task) => !task.missed_at).length;
  return Math.round((onTime / completed.length) * 100);
}

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// Client-side sort for a single status list (FilterRow's sort control) — no
// new API param, since the full section's tasks are already fetched.
export function sortTasks(tasks, sortBy) {
  const sorted = [...tasks];
  if (sortBy === 'priority') {
    sorted.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3));
  } else if (sortBy === 'created') {
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    // 'deadline' (default) — soonest first.
    sorted.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }
  return sorted;
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
