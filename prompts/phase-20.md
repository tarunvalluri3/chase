# Phase 20 — Productivity Analytics 2.0

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 20"). On completion, update `STATE.md` and stop. Full design detail lives in `PHASE_20.md` at the repo root — read it before implementing; this file is the scope summary.

## Goal
Upgrade Insights from Phase 15's task-only trend/reason/priority view into a fuller "Productivity Analytics 2.0" dashboard: KPI cards, the existing task analytics kept and reused, and — genuinely new — analytics derived from Phase 19's time-tracking data (total tracked time, time per task, time vs. outcome), behind a single date-range filter. No AI, no productivity scoring, no invented metrics not directly supported by the `tasks`/`work_sessions` data.

## In scope
- One new read-only endpoint, `GET /api/analytics/summary?range=7d|30d|90d|all`, backed by a new `analyticsService`/`analyticsRepository`/`analyticsController`/`analyticsSchemas` layer — see `PHASE_20.md` §6. **Kept fully separate from task CRUD logic**, no writes, no coupling to `tasksService`'s lifecycle rules.
- The one genuinely new repository capability this requires: querying a user's `work_sessions` **across all of their tasks** within a date range (today `workSessionsRepository` is task-scoped only) — `PHASE_20.md` §0/§6.
- Every metric in `PHASE_20.md` §3: task counts/rates (total, completed, missed-unresolved, missed-ever, deleted, completion/missed/deletion rates), completion/missed trends, priority performance, deadline performance, missed/incomplete/deletion reason breakdowns, and the new time-tracking metrics (total tracked time, time-over-time trend, time per task, time vs. outcome, priority vs. time spent).
- The chart plan in `PHASE_20.md` §4 — new chart components alongside the existing, reused Phase 15 ones, all built on the existing `ChartCard`/`ChartStates`/`chartTheme` conventions and existing color tokens (no new hues).
- A single date-range filter control driving every section from one query param — `PHASE_20.md` §5.
- Frontend restructuring of `Insights.jsx` and `apiClient.js`/`useAnalyticsSummary.js` per `PHASE_20.md` §7.
- Full loading/empty/error/responsive/accessibility UX per `PHASE_20.md` §8, and test coverage per §9.

## Key decision to confirm at approval time
`PHASE_20.md` §2 flags the central architectural fork: **this doc's default assumption is that aggregation moves server-side** (one consolidated endpoint) rather than staying purely client-side like Phase 15, because the new time-tracking metrics need cross-task session data no current endpoint exposes, and because bucketing/summing potentially-unbounded rows in the browser doesn't fit the phase's own "use efficient PostgreSQL queries" instruction. If client-side aggregation (extending `analyticsStats.js` plus a plain non-aggregating "list my sessions" endpoint) is preferred instead, say so at approval — it changes §6/§7 but not the metrics/chart/UX plan.

## Out of scope
- AI insights, AI recommendations, productivity coaching, or any productivity score not directly derivable from existing fields.
- Any change to notification, email, or time-tracking *functionality* itself (Phases 17–19) — this phase only reads their existing data.
- Projects, subtasks, categories/tags, daily planning, or any other item from `PHASES.md`'s Future list beyond item 26.
- New task-management features of any kind.
- Any schema change — no new tables or columns, no migration (`PHASE_20.md` §2/§6).

## Files/areas to create or change
- `server/src/routes/analytics.js`, `controllers/analyticsController.js`, `services/analyticsService.js`, `repositories/analyticsRepository.js`, `validation/analyticsSchemas.js` (new)
- `server/src/repositories/workSessionsRepository.js` (add the one new cross-task query method, per `PHASE_20.md` §6)
- `server/src/app.js` (mount the new route)
- `client/src/lib/apiClient.js` (`analyticsApi.summary`)
- `client/src/hooks/useAnalyticsSummary.js` (new)
- `client/src/routes/Insights.jsx` (restructured per `PHASE_20.md` §4/§8)
- `client/src/components/analytics/` — new: `KpiRow.jsx`, `KpiCard.jsx`, `MissedTrendChart.jsx`, `DeadlinePerformanceChart.jsx`, `TimeTrackedTrendChart.jsx`, `TimePerTaskTable.jsx`, `TimeVsOutcomeChart.jsx`, `PriorityTimeChart.jsx`, `StatusComparisonChart.jsx`, `DateRangeFilter.jsx`; existing Phase 15 chart components reused as-is where possible
- New test files: `server/tests/analytics.*.test.js`, new/extended frontend component + integration tests per `PHASE_20.md` §9

## Acceptance criteria
See `PHASE_20.md` §10 for the full list. Summary: the §2 aggregation-approach decision confirmed with the user before implementation; `GET /api/analytics/summary` implemented, ownership-scoped, covering every §3 metric; no schema changes; every chart in §4 built on existing tokens/conventions; one working date-range filter across the whole page; existing Phase 15 charts preserved and reused, not rebuilt; full backend + frontend test suites passing; `STATE.md` updated with Phase 20 marked `Done` and the §2 decision's resolution logged.
