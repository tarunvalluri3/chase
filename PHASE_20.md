# PHASE_20.md — Productivity Analytics 2.0

> Documentation only. Not implemented. Do not build until the user gives explicit approval ("Approved — build Phase 20"), per `CLAUDE.md`'s governing rule. Pulls forward item **26 — Advanced Productivity Analytics** from `PHASES.md`'s Future list. Depends on data shipped in Phase 15 (Analytics), Phase 17 (Notifications — read-only, no coupling), and Phase 19 (Time Tracking, `work_sessions`) — all already built. Supersedes/upgrades the Phase 15 Insights view rather than replacing it wholesale.

## 0. What already exists (do not rebuild)

Confirmed by direct inspection of the current codebase before writing this doc:

- **`client/src/lib/analyticsStats.js`** — pure client-side aggregations over one unfiltered `GET /api/tasks` fetch: `computeCompletionTrend` (weekly, on-time vs. resolved-from-missed), `computeIncompleteTrend`, `computeDeletedTrend`, `computeIncompleteReasonBreakdown`, `computeDeletedReasonBreakdown`, `computeUnresolvedMissed`, `computePriorityBreakdown` (incomplete-rate per priority, denominator = COMPLETED + INCOMPLETE only).
- **`client/src/routes/Insights.jsx`** + **`client/src/components/analytics/`** (`ChartCard`, `ChartStates`, `chartTheme`, `CompletionTrendChart`, `IncompleteTrendChart`, `DeletedTrendChart`, `ReasonBreakdownChart`, `PriorityBreakdown`, `UnresolvedMissed`) — the current Insights page, all chart styling driven by CSS-token references (`--color-chart-grid`, `--color-chart-axis-label`, status/priority color tokens), Recharts-based, weekly UTC-Monday bucketing hand-rolled (no date library).
- **No backend analytics endpoint exists today** — Phase 15 was explicitly scoped as client-side-only aggregation.
- **`work_sessions`** (Phase 19, `server/supabase/migrations/20260819160000_add_work_sessions.sql`) — segment-based time tracking: `id, task_id, user_id, started_at, ended_at, end_reason (PAUSED|STOPPED|AUTO_STOPPED), created_at, updated_at`, partial unique index enforcing one open segment per task, indexes on `task_id` and `user_id`. No `duration_seconds` column — duration is always derived.
- **`workSessionsRepository`/`workSessionsService`** only expose **per-task** access today (`listByTask`, `getSummary(userId, taskId)`). **There is no endpoint or repository method that lists/aggregates sessions across all of a user's tasks** — every existing method takes a `taskId`. This is the one real gap this phase's backend work needs to fill.
- Existing endpoints (`server/src/routes/tasks.js`, `server/src/routes/workSessions.js`): full task CRUD/lifecycle set, `POST/GET/PATCH /api/tasks...`, `.../:id/complete`, `.../:id/resolve-missed`, `DELETE .../:id`, and nested `.../:id/sessions/{start,pause,resume,stop}`, `.../:id/sessions`, `.../:id/sessions/summary`.

This phase **extends** the above. Phase 15's existing task-only trend/reason/priority charts are kept (reused, not deleted) but folded into the same upgraded Insights page alongside new KPI cards and the new time-tracking analytics.

## 1. Goal

Upgrade Insights from Phase 15's task-only trend/reason/priority view into a fuller productivity dashboard: KPI cards for at-a-glance numbers, the existing task analytics, and — genuinely new — analytics derived from Phase 19's time-tracking data (total tracked time, time per task, time vs. outcome), plus a date-range filter. No AI, no scoring beyond what the data directly supports, no new task-management features.

## 2. Key architectural decision to confirm before implementation

Phase 15 aggregated entirely client-side over one already-fetched, unfiltered task list. That doesn't extend cleanly to this phase because:
- Time-tracking metrics (total tracked time, time per task, time vs. outcome) require **session data across every one of a user's tasks**, which no current endpoint provides — today `work_sessions` is only queryable per-task.
- A date-range filter over both tasks and sessions is naturally a server-side `WHERE` clause (indexed on `user_id`/`deadline`/`started_at`), not a client-side re-filter of an unbounded fetch.

**Recommendation (this doc's default, not yet approved): move aggregation server-side.** Add one new read-only endpoint, `GET /api/analytics/summary?range=...`, backed by a new `analyticsService`/`analyticsRepository`, that returns one consolidated JSON payload with every KPI, trend series, breakdown, and time-tracking metric this phase needs for the selected range. The client fetches this once per range-change instead of re-deriving everything from raw rows. This also better matches the phase's own instruction to "keep analytics logic separate from task CRUD logic" and "use efficient PostgreSQL queries" — pulling every session row across every task to the client to sum in JS doesn't scale the way a single filtered, indexed query does.

**No schema changes are required for this** — no new tables/columns, no migration. Aggregation happens by querying the existing `tasks` and `work_sessions` tables (via `@supabase/supabase-js`'s query builder, scoped by `user_id` and the date range) and summing/bucketing in the service layer, the same way Phase 15's trend functions already bucket in JS — just moved server-side and now covering `work_sessions` too. This keeps the phase code-only, per its own "no unrelated schema changes" constraint.

If the user prefers to keep aggregation client-side (extending `analyticsStats.js` and adding a plain, non-aggregating "list all my sessions" endpoint instead), that is also buildable — flagged here as the one real fork in approach, the way Phase 19 flagged its auto-close decision. This doc proceeds on the server-side-aggregation assumption; note at approval time if the other direction is preferred instead.

## 3. Metrics / KPIs and their data sources

All read from `tasks` (Phase 2/6 schema) and `work_sessions` (Phase 19 schema), scoped to the authenticated user and the selected date range. No metric here is invented beyond what these two tables directly support.

| Metric | Definition | Source |
|---|---|---|
| Total tasks | count of tasks created in range | `tasks.created_at` |
| Completed tasks | count where `status = COMPLETED` | `tasks.status` |
| Missed tasks (unresolved) | count where `status = MISSED` right now — a pending checkpoint, **not** a verdict (per `CLAUDE.md`) | `tasks.status` |
| Tasks that passed through MISSED | count where `missed_at is not null`, regardless of current status — a detection-event count, kept separate from "unresolved missed" and never labeled as "never completed" | `tasks.missed_at` |
| Deleted tasks | count where `status = DELETED` | `tasks.status` |
| Completion rate | `COMPLETED / (COMPLETED + INCOMPLETE)` — same denominator convention Phase 15 already established for `computePriorityBreakdown` (ACTIVE/MISSED/DELETED haven't reached a completed-vs-incomplete verdict) | `tasks.status` |
| Missed rate | `(tasks with missed_at is not null) / total tasks created` — a "how often did the system have to flag something overdue" rate, explicitly distinct from completion rate | `tasks.missed_at`, `tasks.created_at` |
| Deletion rate | `DELETED / total tasks created` | `tasks.status`, `tasks.created_at` |
| Completion trend over time | weekly count of `COMPLETED`, split on-time vs. resolved-from-missed — **reused from Phase 15's `computeCompletionTrend` as-is**, just fed by the new endpoint's payload instead of a client-side recompute | `tasks.completed_at`, `tasks.missed_at` |
| Missed trend over time | **new** — weekly count of `missed_at` occurrences (detection events), independent of eventual resolution | `tasks.missed_at` |
| Priority performance | incomplete-rate per priority — **reused from Phase 15's `computePriorityBreakdown`** | `tasks.priority`, `tasks.status` |
| Deadline performance | **new** — of all `COMPLETED` tasks, % completed at/before `deadline` vs. after, compared directly on `completed_at` vs. `deadline` (catches the case where a task is completed late while still `ACTIVE`, before any lazy `MISSED` transition has run — a real edge case, not just tasks that passed through `MISSED`) | `tasks.completed_at`, `tasks.deadline` |
| Missed/incomplete reasons | ranked breakdown of `incomplete_reason` — **reused from Phase 15's `computeIncompleteReasonBreakdown`** | `tasks.incomplete_reason` |
| Deletion reasons | ranked breakdown of `deletion_reason` — **reused from Phase 15's `computeDeletedReasonBreakdown`** | `tasks.deletion_reason` |
| Total tracked time | sum of all segment durations (`ended_at - started_at`, or `now() - started_at` for any still-open segment) across every task in range | `work_sessions.started_at/ended_at` |
| Time spent over time | weekly sum of tracked seconds, bucketed by each segment's `started_at` (same weekly-bucket convention as the task trends, for one consistent time axis across the whole page) | `work_sessions.started_at/ended_at` |
| Time spent per task | per-task total tracked seconds, ranked descending (top N + "Other" or a scrollable table — see §5) | `work_sessions.task_id`, summed durations |
| Time spent vs. task outcomes | average tracked time per task, grouped by the task's current terminal status (`COMPLETED` / `INCOMPLETE` / `DELETED`) — genuinely new pattern this phase's data makes possible for the first time | `work_sessions` joined to `tasks.status` |
| Priority vs. time spent | average tracked time per task, grouped by `priority` — a light extension of the existing priority-performance angle, now with a time dimension | `work_sessions` joined to `tasks.priority` |

No productivity "score" is computed — every number above is a direct count, rate, sum, or average over real fields, per the phase's explicit "no invented metrics" and "no scoring" constraints.

## 4. Chart / visualization plan

| Section | Visualization | Notes |
|---|---|---|
| Top KPI row | KPI cards (mono `display`-scale numeral, same `StatTile` pattern as the Phase 14 dashboard) | Total tasks, completion rate, missed rate, deletion rate, total tracked time |
| Completion vs. missed vs. deleted | Bar chart (counts side by side) | New; the existing per-status trend charts already show shape over time, this gives one direct-comparison snapshot for the selected range |
| Completion trend | Line/area chart, weekly, on-time vs. resolved-from-missed | Reused from Phase 15 |
| Missed trend | Line/area chart, weekly | New |
| Priority performance | Horizontal bar (monochrome rail colors) | Reused from Phase 15 |
| Deadline performance | Donut/pie (on-time vs. late) | New — two-slice, reuses `--color-completed` at two opacities the way the existing on-time/resolved split already does, no new hue |
| Incomplete reasons | Ranked horizontal bars | Reused from Phase 15 |
| Deletion reasons | Ranked horizontal bars | Reused from Phase 15 |
| Unresolved missed | List (not a chart) | Reused from Phase 15 |
| Time tracked over time | Area chart, weekly | New |
| Time spent per task | Table (task title, total time, status) sorted descending | New — a table is the right shape here since it's inherently a per-item ranking with more than one field (title + time + status), not a single trending number |
| Time spent vs. outcome | Bar chart (avg time, one bar per terminal status) | New |
| Priority vs. time spent | Bar chart (avg time, one bar per priority, monochrome rail colors) | New |

Every chart continues to read colors exclusively from existing CSS custom-property tokens (`chartTheme.js`, status/priority tokens) — no new hues introduced, matching Phase 15's established "reuse the existing muted palette rather than fight it with new saturated chart-only colors" decision.

## 5. Date-range filtering

A single range control at the top of Insights, applied to every section on the page (one filter, not per-chart filters, to avoid overcrowding per the phase's own UX instruction). Presets: **Last 7 days · Last 30 days · Last 90 days · All time**, mapped to a `range` query param (`7d`/`30d`/`90d`/`all`) on `GET /api/analytics/summary`. "All time" is the default, matching Phase 15's unfiltered behavior so nothing regresses for a user who never touches the filter.

Range applies to the field each metric is naturally keyed on (`created_at` for volume counts, `completed_at`/`missed_at`/`incomplete_at`/`deleted_at` for their respective trends/breakdowns, `started_at` for time-tracking metrics) — not a single blanket `created_at` filter, since a task created outside the range but completed inside it should still count toward that range's completion metrics (same reasoning Phase 15's per-field weekly bucketing already uses).

## 6. Backend

```
server/src/routes/analytics.js          — GET /api/analytics/summary
server/src/controllers/analyticsController.js
server/src/services/analyticsService.js   — all aggregation/bucketing logic
server/src/repositories/analyticsRepository.js  — Supabase calls only
server/src/validation/analyticsSchemas.js  — Zod validation of ?range=
```

- Mounted at `/api/analytics`, behind the same `requireAuthenticated` middleware as every other route.
- `analyticsRepository` adds the one genuinely new query capability this phase requires: fetching a user's `work_sessions` **across all tasks** within a date range (joined/filtered against `tasks` for status/priority where needed) — the only repository gap identified in §0.
- `analyticsService` owns all bucketing/rate/average math, reusing the same weekly-bucket helper logic Phase 15's `analyticsStats.js` already established (ported server-side, not reinvented) so the two are consistent if any client-side computation remains for the reused charts.
- One endpoint, one response shape, covering every metric in §3 — avoids a chatty multi-endpoint page load and matches the phase's own "not a generic status-update-style endpoint sprawl" spirit already established for tasks.
- No writes, no side effects, no coupling to `tasksService`'s lifecycle rules — this is a pure read/aggregation layer, kept fully separate from task CRUD per the phase's explicit instruction.
- No new environment variables, no new dependencies.

## 7. Frontend

- `client/src/lib/apiClient.js` gains `analyticsApi.summary(range)`.
- `client/src/hooks/useAnalyticsSummary.js` (new) — replaces `Insights.jsx`'s current reliance on `useDashboardTasks` + `analyticsStats.js` for the page's own state (loading/error/loaded), fetching the one new endpoint instead. Existing `analyticsStats.js` functions can still be reused **as pure formatting/shaping helpers** if the server payload is shaped close to their existing return values, minimizing rewrite of the already-approved, already-tested chart components.
- New chart components under `client/src/components/analytics/`: `KpiRow.jsx`/`KpiCard.jsx`, `MissedTrendChart.jsx`, `DeadlinePerformanceChart.jsx`, `TimeTrackedTrendChart.jsx`, `TimePerTaskTable.jsx`, `TimeVsOutcomeChart.jsx`, `PriorityTimeChart.jsx`, `StatusComparisonChart.jsx`, plus a `DateRangeFilter.jsx` control. All follow the existing `ChartCard`/`ChartStates`/`chartTheme` conventions rather than introducing new ones.
- `Insights.jsx` restructured into the new section order (§4), with the range filter at the top driving one refetch.

## 8. UX requirements

- Loading: skeletons sized per section (KPI row skeleton, chart skeletons at existing `sm`/`md`/`lg` sizes) — matches Phase 15's convention, never a spinner.
- Empty: verbatim "Nothing to show yet." for a user with no tasks at all in range (already established copy) — and a distinct, honest empty note for a section with tasks but zero tracked time ("No time tracked yet." for the time-tracking sections specifically, rather than hiding those sections silently, so the user understands why they're sparse).
- Error: mapped copy + Retry, never a raw API message — same as every other error surface in the app.
- Strong visual hierarchy: KPI row first, task-outcome analytics next, time-tracking analytics last — most-glanceable numbers before deeper trend/detail sections, per the phase's "prioritize the most valuable information first" instruction.
- Responsive/mobile-first, consistent with every other phase — no desktop-only layout assumptions.
- Tooltips, legends, and axis labels on every chart that needs them (reusing `chartTheme.js`'s existing tooltip/legend styling).
- Accessible color use: continue the existing "never color alone" rule (word/label always present, not just a hue) already verified in Phase 16's audit.
- Consistent formatting: reuse `lib/datetime.js` for all date/time display and the existing `formatDuration` (`H:MM:SS`/`MM:SS`, from Phase 19's frontend work) for every duration shown here, rather than introducing a second duration formatter.

## 9. Testing requirements

**Backend:**
- `analyticsService` unit tests (pure function tests, mocked repository) — correct math for every KPI/rate/average in §3, including edge cases: zero tasks, zero sessions, a task with an open (unfinished) session at request time, a task completed exactly on its deadline.
- `analytics.integration.test.js` (real DB, matching the existing integration-test pattern) — seeded tasks + sessions across two users, confirming `GET /api/analytics/summary` returns correct, cross-user-isolated numbers, correct behavior for every `range` value, and a `400` for an invalid `range`.
- Auth requirement (401 without a session) matching every other route's existing test pattern.

**Frontend:**
- Component tests for every new chart/KPI component (rendering/props correctness, matching Phase 16's established scope — not pixel-perfect visuals).
- `Insights.jsx` integration test extended: range-filter interaction triggers the correct refetch/query param, loading/empty/error states render correctly for the new endpoint shape.
- Reuse existing mobile-viewport/contrast/reduced-motion verification passes from Phases 15/16 rather than introducing a new verification method.

## 10. Acceptance criteria

- [ ] The client-side-vs-server-side aggregation decision in §2 confirmed with the user before implementation begins.
- [ ] `GET /api/analytics/summary?range=...` implemented, ownership-scoped, returning every metric in §3.
- [ ] No new tables/columns/migrations — this phase is code-only, per its own "no unrelated schema changes" instruction.
- [ ] Every chart in §4 implemented and reading colors exclusively from existing tokens (no new hues).
- [ ] Date-range filter working across every section from one control.
- [ ] Existing Phase 15 charts (completion trend, priority performance, incomplete/deletion reason breakdowns, unresolved missed) preserved and reused, not rebuilt from scratch.
- [ ] Full backend and frontend test suites (existing + new) passing.
- [ ] `STATE.md` updated: Phase 20 marked `Done`, with the §2 decision's actual resolution logged.
