import * as tasksRepository from '../repositories/tasksRepository.js';
import * as workSessionsRepository from '../repositories/workSessionsRepository.js';

// Phase 20 -- Productivity Analytics 2.0. Server-side aggregation over
// `tasks` and `work_sessions` (approved over the Phase 15 client-side
// approach specifically because time-tracking metrics need session data
// across every one of a user's tasks, which no per-task endpoint exposes).
// The weekly-bucketing math here intentionally mirrors
// client/src/lib/analyticsStats.js's algorithm (ported server-side, not
// reinvented) so the reused Phase 15 charts render identically once fed
// this endpoint's payload instead of a client-side recompute.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };
const RANGE_WEEKS = { '7d': 2, '30d': 5, '90d': 13, all: 12 };

// The lower bound (ISO string) each metric filters its own naturally-keyed
// timestamp field against -- null for 'all' (no lower bound), matching
// Phase 15's previously-unfiltered default so nothing regresses.
function rangeSince(range, now) {
  const days = RANGE_DAYS[range];
  if (days == null) return null;
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

function withinRange(iso, sinceIso) {
  if (!iso) return false;
  if (!sinceIso) return true;
  return new Date(iso).getTime() >= new Date(sinceIso).getTime();
}

function weekKey(isoUtc) {
  const d = new Date(isoUtc);
  const day = d.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayOffset));
  return monday.toISOString().slice(0, 10);
}

const weekLabelFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function weekLabel(key) {
  return weekLabelFormatter.format(new Date(`${key}T00:00:00Z`));
}

function recentWeekKeys(count, now) {
  const currentKey = weekKey(now.toISOString());
  const currentMonday = new Date(`${currentKey}T00:00:00Z`).getTime();
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(new Date(currentMonday - i * WEEK_MS).toISOString().slice(0, 10));
  }
  return keys;
}

function emptyWeeklyBuckets(keys, shape) {
  return new Map(keys.map((key) => [key, { week: key, ...shape }]));
}

function bucketsToSeries(keys, buckets) {
  return keys.map((key) => ({ ...buckets.get(key), label: weekLabel(key) }));
}

// --- task-derived metrics -----------------------------------------------

function computeCompletionTrend(tasks, weeks, now) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = emptyWeeklyBuckets(keys, { onTime: 0, resolved: 0 });

  for (const task of tasks) {
    if (task.status !== 'COMPLETED' || !task.completed_at) continue;
    const bucket = buckets.get(weekKey(task.completed_at));
    if (!bucket) continue;
    if (task.missed_at) bucket.resolved += 1;
    else bucket.onTime += 1;
  }

  return bucketsToSeries(keys, buckets);
}

// New in Phase 20: weekly count of missed_at occurrences (detection
// events), independent of whether the task was later resolved as COMPLETED
// or INCOMPLETE -- never conflated with "never completed" per CLAUDE.md.
function computeMissedTrend(tasks, weeks, now) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = emptyWeeklyBuckets(keys, { count: 0 });

  for (const task of tasks) {
    if (!task.missed_at) continue;
    const bucket = buckets.get(weekKey(task.missed_at));
    if (!bucket) continue;
    bucket.count += 1;
  }

  return bucketsToSeries(keys, buckets);
}

function computeIncompleteTrend(tasks, weeks, now) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = emptyWeeklyBuckets(keys, { count: 0 });

  for (const task of tasks) {
    if (task.status !== 'INCOMPLETE' || !task.incomplete_at) continue;
    const bucket = buckets.get(weekKey(task.incomplete_at));
    if (!bucket) continue;
    bucket.count += 1;
  }

  return bucketsToSeries(keys, buckets);
}

function computeDeletedTrend(tasks, weeks, now) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = emptyWeeklyBuckets(keys, { count: 0 });

  for (const task of tasks) {
    if (task.status !== 'DELETED' || !task.deleted_at) continue;
    const bucket = buckets.get(weekKey(task.deleted_at));
    if (!bucket) continue;
    bucket.count += 1;
  }

  return bucketsToSeries(keys, buckets);
}

const OTHER_LABEL = 'Other';
const MAX_REASON_BUCKETS = 5;

function rankReasons(tasks, reasonKey, limit = MAX_REASON_BUCKETS) {
  const counts = new Map();
  for (const task of tasks) {
    const raw = task[reasonKey];
    if (!raw || !raw.trim()) continue;
    const key = raw.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit).reduce((sum, [, count]) => sum + count, 0);
  const result = top.map(([reason, count]) => ({ reason, count }));
  if (rest > 0) result.push({ reason: OTHER_LABEL, count: rest });
  return result;
}

// Not range-filtered -- this is a current "needs attention" snapshot
// (CLAUDE.md: MISSED is a pending checkpoint, not history), same as Phase
// 15's original behavior.
function computeUnresolvedMissed(tasks) {
  return tasks
    .filter((task) => task.status === 'MISSED')
    .sort((a, b) => new Date(a.missed_at).getTime() - new Date(b.missed_at).getTime())
    .map((task) => ({ id: task.id, title: task.title, missed_at: task.missed_at }));
}

const PRIORITY_ORDER = ['HIGH', 'MEDIUM', 'LOW'];

function computePriorityBreakdown(tasks, sinceIso) {
  const totals = { HIGH: { completed: 0, incomplete: 0 }, MEDIUM: { completed: 0, incomplete: 0 }, LOW: { completed: 0, incomplete: 0 } };

  for (const task of tasks) {
    const bucket = totals[task.priority];
    if (!bucket) continue;
    if (task.status === 'COMPLETED' && withinRange(task.completed_at, sinceIso)) bucket.completed += 1;
    else if (task.status === 'INCOMPLETE' && withinRange(task.incomplete_at, sinceIso)) bucket.incomplete += 1;
  }

  return PRIORITY_ORDER.map((priority) => {
    const { completed, incomplete } = totals[priority];
    const total = completed + incomplete;
    return {
      priority,
      completed,
      incomplete,
      total,
      incompleteRate: total > 0 ? incomplete / total : 0,
    };
  });
}

// New in Phase 20: compares completed_at directly to deadline for every
// COMPLETED task in range -- catches a task completed late while still
// ACTIVE (before any lazy MISSED transition ran), not just tasks that
// happened to pass through MISSED first.
function computeDeadlinePerformance(tasks, sinceIso) {
  let onTime = 0;
  let late = 0;

  for (const task of tasks) {
    if (task.status !== 'COMPLETED' || !withinRange(task.completed_at, sinceIso)) continue;
    if (new Date(task.completed_at).getTime() <= new Date(task.deadline).getTime()) onTime += 1;
    else late += 1;
  }

  return { onTime, late, total: onTime + late };
}

// --- time-tracking metrics (work_sessions) -------------------------------

function sessionSeconds(session, nowMs) {
  const startedMs = new Date(session.started_at).getTime();
  const endedMs = session.ended_at ? new Date(session.ended_at).getTime() : nowMs;
  return Math.max(0, (endedMs - startedMs) / 1000);
}

function computeTimeTrackedTrend(sessions, weeks, now) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = emptyWeeklyBuckets(keys, { seconds: 0 });
  const nowMs = now.getTime();

  for (const session of sessions) {
    const bucket = buckets.get(weekKey(session.started_at));
    if (!bucket) continue;
    bucket.seconds += sessionSeconds(session, nowMs);
  }

  return bucketsToSeries(keys, buckets).map((entry) => ({ ...entry, seconds: Math.round(entry.seconds) }));
}

const MAX_TIME_PER_TASK_ROWS = 20;

function computeTimePerTask(sessions, tasksById, nowMs) {
  const totals = new Map();
  for (const session of sessions) {
    totals.set(session.task_id, (totals.get(session.task_id) ?? 0) + sessionSeconds(session, nowMs));
  }

  return [...totals.entries()]
    .map(([taskId, seconds]) => {
      const task = tasksById.get(taskId);
      return {
        id: taskId,
        title: task?.title ?? 'Deleted task',
        status: task?.status ?? null,
        seconds: Math.round(seconds),
      };
    })
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, MAX_TIME_PER_TASK_ROWS);
}

const OUTCOME_STATUSES = ['COMPLETED', 'INCOMPLETE', 'DELETED'];

// New in Phase 20, only possible once time-tracking data exists: average
// tracked time per task, grouped by the task's current terminal status.
function computeTimeVsOutcome(sessions, tasksById, nowMs) {
  const totals = { COMPLETED: { seconds: 0, taskIds: new Set() }, INCOMPLETE: { seconds: 0, taskIds: new Set() }, DELETED: { seconds: 0, taskIds: new Set() } };

  for (const session of sessions) {
    const task = tasksById.get(session.task_id);
    const bucket = task && totals[task.status];
    if (!bucket) continue;
    bucket.seconds += sessionSeconds(session, nowMs);
    bucket.taskIds.add(session.task_id);
  }

  return OUTCOME_STATUSES.map((status) => {
    const { seconds, taskIds } = totals[status];
    const count = taskIds.size;
    return { status, avgSeconds: count > 0 ? Math.round(seconds / count) : 0, count };
  });
}

function computePriorityTimeSpent(sessions, tasksById, nowMs) {
  const totals = { HIGH: { seconds: 0, taskIds: new Set() }, MEDIUM: { seconds: 0, taskIds: new Set() }, LOW: { seconds: 0, taskIds: new Set() } };

  for (const session of sessions) {
    const task = tasksById.get(session.task_id);
    const bucket = task && totals[task.priority];
    if (!bucket) continue;
    bucket.seconds += sessionSeconds(session, nowMs);
    bucket.taskIds.add(session.task_id);
  }

  return PRIORITY_ORDER.map((priority) => {
    const { seconds, taskIds } = totals[priority];
    const count = taskIds.size;
    return { priority, avgSeconds: count > 0 ? Math.round(seconds / count) : 0, count };
  });
}

// --- top-level KPIs --------------------------------------------------------

function computeKpis(tasks, totalTrackedSeconds, sinceIso) {
  let totalTasks = 0;
  let completedTasks = 0;
  let missedEverTasks = 0;
  let deletedTasks = 0;
  let missedUnresolvedTasks = 0;

  for (const task of tasks) {
    if (task.status === 'MISSED') missedUnresolvedTasks += 1; // current snapshot, not range-scoped
    if (withinRange(task.created_at, sinceIso)) totalTasks += 1;
    if (task.status === 'COMPLETED' && withinRange(task.completed_at, sinceIso)) completedTasks += 1;
    if (withinRange(task.missed_at, sinceIso)) missedEverTasks += 1;
    if (task.status === 'DELETED' && withinRange(task.deleted_at, sinceIso)) deletedTasks += 1;
  }

  let incompleteTasks = 0;
  for (const task of tasks) {
    if (task.status === 'INCOMPLETE' && withinRange(task.incomplete_at, sinceIso)) incompleteTasks += 1;
  }

  const resolvedTotal = completedTasks + incompleteTasks;

  return {
    totalTasks,
    completedTasks,
    missedUnresolvedTasks,
    missedEverTasks,
    deletedTasks,
    completionRate: resolvedTotal > 0 ? completedTasks / resolvedTotal : 0,
    missedRate: totalTasks > 0 ? missedEverTasks / totalTasks : 0,
    deletionRate: totalTasks > 0 ? deletedTasks / totalTasks : 0,
    totalTrackedSeconds: Math.round(totalTrackedSeconds),
  };
}

export async function getSummary(userId, range) {
  const now = new Date();
  const sinceIso = rangeSince(range, now);
  const weeks = RANGE_WEEKS[range];

  // tasks: one unfiltered fetch (same convention as Phases 14/15's
  // dashboard/insights), then each metric filters on its own naturally-
  // keyed timestamp field -- a task created outside the range but resolved
  // inside it should still count toward that range's outcome metrics.
  const [tasks, sessions] = await Promise.all([
    tasksRepository.listByUser(userId),
    workSessionsRepository.listByUserSince(userId, sinceIso),
  ]);

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const nowMs = now.getTime();
  const totalTrackedSeconds = sessions.reduce((sum, session) => sum + sessionSeconds(session, nowMs), 0);

  return {
    range,
    kpis: computeKpis(tasks, totalTrackedSeconds, sinceIso),
    completionTrend: computeCompletionTrend(tasks, weeks, now),
    missedTrend: computeMissedTrend(tasks, weeks, now),
    incompleteTrend: computeIncompleteTrend(tasks, weeks, now),
    deletedTrend: computeDeletedTrend(tasks, weeks, now),
    priorityBreakdown: computePriorityBreakdown(tasks, sinceIso),
    deadlinePerformance: computeDeadlinePerformance(tasks, sinceIso),
    incompleteReasons: rankReasons(
      tasks.filter((t) => t.status === 'INCOMPLETE' && withinRange(t.incomplete_at, sinceIso)),
      'incomplete_reason',
    ),
    deletedReasons: rankReasons(
      tasks.filter((t) => t.status === 'DELETED' && withinRange(t.deleted_at, sinceIso)),
      'deletion_reason',
    ),
    unresolvedMissed: computeUnresolvedMissed(tasks),
    timeTrackedTrend: computeTimeTrackedTrend(sessions, weeks, now),
    timePerTask: computeTimePerTask(sessions, tasksById, nowMs),
    timeVsOutcome: computeTimeVsOutcome(sessions, tasksById, nowMs),
    priorityTimeSpent: computePriorityTimeSpent(sessions, tasksById, nowMs),
  };
}
