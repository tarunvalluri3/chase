# Phase 18 — Time Tracking

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 18"). On completion, update `STATE.md` and stop. Full design detail lives in `PHASE_18.md` at the repo root — read it before implementing; this file is the scope summary.

## Goal
Let users track actual work time against a task via Start/Pause/Resume/Stop, backed by a dedicated `work_sessions` table (one row per continuous work segment, not a single accumulated-time field on `tasks`), with correct interaction with the task lifecycle and data shaped so a future planned-vs-actual analytics phase can build on it without a rework.

## In scope
- `work_sessions` table (migration) — segment-based model per `PHASE_18.md` §2, including the partial unique index that enforces "at most one open segment per task" at the database level.
- Six endpoints nested under a task: `POST /api/tasks/:id/sessions/{start,pause,resume,stop}`, `GET /api/tasks/:id/sessions`, `GET /api/tasks/:id/sessions/summary` — see `PHASE_18.md` §3.
- `workSessionsService.js` enforcing the lifecycle/precondition rules in `PHASE_18.md` §4 (Start/Resume ACTIVE-only, no double-open, Resume only after a Pause, etc.), `workSessionsRepository.js` (Supabase calls only), `workSessionsController.js`, `workSessionSchemas.js` (param validation only — no client-writable fields on any action endpoint).
- Auto-closing an open session (`end_reason = 'AUTO_STOPPED'`) when its task leaves `ACTIVE` via Complete, Delete, or the automatic `ACTIVE→MISSED` transition — see `PHASE_18.md` §5, including the explicit note that this approach (vs. leaving sessions open and treating status-off-ACTIVE as an implicit stop at read time) should be confirmed with the user before/at approval, not just assumed.
- Full ownership scoping on every endpoint, matching the existing task-ownership pattern (404, not 403, for a foreign or nonexistent task id).
- Test coverage per `PHASE_18.md` §8: lifecycle happy path, invalid-state 409s, ownership/cross-user tests, auto-close behavior, and derived total-time correctness across multiple segments.

## Out of scope
- Any planned-vs-actual time UI or comparison logic (`PHASES.md`'s future Phase 21) — this phase only makes the actual-time data correctly capturable and structured for that later.
- Any frontend work (task detail UI for Start/Pause/Resume/Stop, a sessions list view) — this phase is backend-only, matching how Phases 0–8 preceded Phases 9+ for the original task model.
- Editing or deleting individual session rows — sessions are append-only historical record, same posture `CLAUDE.md` already takes toward completed/missed/deleted tasks.
- Phase 17 (Notifications & Email) — independent of this phase; no session-related email types are added here.

## Files/areas to create or change
- `server/src/routes/workSessions.js`, `controllers/workSessionsController.js`, `services/workSessionsService.js`, `repositories/workSessionsRepository.js`, `validation/workSessionSchemas.js` (new)
- `server/src/services/tasksService.js` (add the three `autoCloseOpenSession` call sites — `completeTask`, `deleteTask`, `maybeTransitionToMissed`)
- `server/src/app.js` / `routes/tasks.js` (mount the new nested routes)
- `server/supabase/migrations/` (new migration: `work_sessions`)
- New test files under `server/tests/` covering the above.

## Acceptance criteria
See `PHASE_18.md` §9 for the full list. Summary: migration applied (including the partial unique index) and verified live; all six endpoints correctly enforce every valid/invalid transition; Start/Resume rejected on any non-`ACTIVE` task; the auto-close decision is confirmed with the user and, once resolved, implemented and tested; `GET /sessions/summary` computes a correct derived total across multiple segments including an open one; full backend test suite (existing + new) passes; `STATE.md` updated with Phase 18 marked `Done`.
