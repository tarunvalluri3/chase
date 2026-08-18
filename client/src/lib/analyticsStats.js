// Client-side aggregation over the full unfiltered task list (DESIGN.md §12,
// Phase 15) — same "no new backend aggregation endpoint" approach as
// lib/taskStats.js (Phase 14). Everything here is a pure function over the
// array useDashboardTasks already fetches; analytics reuses that hook as-is
// rather than duplicating the fetch.
//
// Per CLAUDE.md's lifecycle rules, MISSED is a transient pending checkpoint,
// not a terminal outcome — it is never treated as a trend/history bucket
// here, only as a current "needs attention" count/list (computeUnresolvedMissed).
// INCOMPLETE is the meaningful "didn't get done" verdict.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Monday-start UTC week key ("2026-08-11") for a given ISO timestamp.
function weekKey(isoUtc) {
  const d = new Date(isoUtc);
  const day = d.getUTCDay(); // 0 = Sunday
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayOffset));
  return monday.toISOString().slice(0, 10);
}

const weekLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function weekLabel(key) {
  return weekLabelFormatter.format(new Date(`${key}T00:00:00Z`));
}

// Builds the last `count` Monday-start week keys, oldest first, ending on
// the week containing `now` — so trend charts always show a fixed, empty-
// friendly window rather than only weeks that happen to have data.
function recentWeekKeys(count, now = new Date()) {
  const currentKey = weekKey(now.toISOString());
  const currentMonday = new Date(`${currentKey}T00:00:00Z`).getTime();
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(new Date(currentMonday - i * WEEK_MS).toISOString().slice(0, 10));
  }
  return keys;
}

// Completions over the last `weeks` weeks, split into two series sharing one
// hue (DESIGN.md §12): on-time (completed_at set, never passed through
// MISSED) vs. resolved-from-missed (completed_at set, missed_at also set).
export function computeCompletionTrend(tasks, { weeks = 8, now = new Date() } = {}) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = new Map(keys.map((key) => [key, { week: key, onTime: 0, resolved: 0 }]));

  for (const task of tasks) {
    if (task.status !== 'COMPLETED' || !task.completed_at) continue;
    const key = weekKey(task.completed_at);
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the visible window
    if (task.missed_at) bucket.resolved += 1;
    else bucket.onTime += 1;
  }

  return keys.map((key) => ({ ...buckets.get(key), label: weekLabel(key) }));
}

// Confirmed-incomplete tasks over the last `weeks` weeks, keyed to
// incomplete_at (when the user actually confirmed it, not when it first
// went MISSED).
export function computeIncompleteTrend(tasks, { weeks = 8, now = new Date() } = {}) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = new Map(keys.map((key) => [key, { week: key, count: 0 }]));

  for (const task of tasks) {
    if (task.status !== 'INCOMPLETE' || !task.incomplete_at) continue;
    const key = weekKey(task.incomplete_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
  }

  return keys.map((key) => ({ ...buckets.get(key), label: weekLabel(key) }));
}

// Deleted tasks over the last `weeks` weeks, keyed to deleted_at.
export function computeDeletedTrend(tasks, { weeks = 8, now = new Date() } = {}) {
  const keys = recentWeekKeys(weeks, now);
  const buckets = new Map(keys.map((key) => [key, { week: key, count: 0 }]));

  for (const task of tasks) {
    if (task.status !== 'DELETED' || !task.deleted_at) continue;
    const key = weekKey(task.deleted_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
  }

  return keys.map((key) => ({ ...buckets.get(key), label: weekLabel(key) }));
}

const OTHER_LABEL = 'Other';
const MAX_REASON_BUCKETS = 5;

// Ranks free-text reasons by frequency (exact trimmed match), keeping the
// top `limit` and folding the remainder into "Other" — reasons are
// free-typed history (CLAUDE.md), not an enum, so exact-string grouping is
// the honest option without inventing a categorization scheme.
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

export function computeIncompleteReasonBreakdown(tasks) {
  return rankReasons(
    tasks.filter((t) => t.status === 'INCOMPLETE'),
    'incomplete_reason',
  );
}

export function computeDeletedReasonBreakdown(tasks) {
  return rankReasons(
    tasks.filter((t) => t.status === 'DELETED'),
    'deletion_reason',
  );
}

// MISSED is a pending checkpoint, not a trend (CLAUDE.md) — surfaced as a
// current "needs attention" list, oldest-first (longest unresolved first).
export function computeUnresolvedMissed(tasks) {
  return tasks
    .filter((task) => task.status === 'MISSED')
    .sort((a, b) => new Date(a.missed_at).getTime() - new Date(b.missed_at).getTime());
}

const PRIORITY_ORDER = ['HIGH', 'MEDIUM', 'LOW'];

// For each priority: how many tasks that reached a terminal completed-vs-
// incomplete outcome ended up INCOMPLETE. Only counts tasks that actually
// reached one of those two terminal states — ACTIVE/MISSED/DELETED tasks
// aren't part of a "did the work get done" verdict yet.
export function computePriorityBreakdown(tasks) {
  const totals = { HIGH: { completed: 0, incomplete: 0 }, MEDIUM: { completed: 0, incomplete: 0 }, LOW: { completed: 0, incomplete: 0 } };

  for (const task of tasks) {
    const bucket = totals[task.priority];
    if (!bucket) continue;
    if (task.status === 'COMPLETED') bucket.completed += 1;
    else if (task.status === 'INCOMPLETE') bucket.incomplete += 1;
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
