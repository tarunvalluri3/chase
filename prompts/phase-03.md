# Phase 3 — Core Task REST API

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 3"). On completion, update `STATE.md` and stop — do not proceed to Phase 4 without separate approval.

## Goal
Build the full task REST API end-to-end through all layers (route → middleware → controller → service → repository → Postgres), implementing create, list, get-one, edit, complete, miss, and soft-delete, with correct lifecycle enforcement.

## In scope
- Implement the full endpoint set from `CLAUDE.md`:
  - `POST /api/tasks`
  - `GET /api/tasks` (supports `?status=ACTIVE|COMPLETED|MISSED|DELETED`)
  - `GET /api/tasks/:id`
  - `PATCH /api/tasks/:id`
  - `POST /api/tasks/:id/complete`
  - `POST /api/tasks/:id/miss` (body: `{ "reason": "..." }`)
  - `DELETE /api/tasks/:id` (body: `{ "reason": "..." }`)
- Build out the layers properly:
  - Routes: wire endpoints, apply auth middleware from Phase 1.
  - Controllers: thin — parse request, call service, shape HTTP response.
  - Services: hold all business/state-transition logic (allowed transitions only: `ACTIVE→COMPLETED`, `ACTIVE→MISSED`, `ACTIVE→DELETED`).
  - Repositories: parameterized SQL only, using the connection pool from Phase 2.
- Ensure every task is scoped to the authenticated user (basic ownership — deeper security hardening is Phase 5, but this phase must not ship code that ignores ownership).
- Ensure the `users` table is populated/looked-up correctly: on first authenticated request, find-or-create the internal `users` row keyed by `clerk_user_id`, and use the internal `users.id` as the FK for tasks (never the Clerk id directly).
- Enforce field-level rules on PATCH: only `title`, `description`, `deadline`, `priority` are editable, only on ACTIVE tasks; reject attempts to set `user_id`, `status`, timestamps, `missed_reason`, `deletion_reason`.
- Enforce reason requirements: `miss` and soft-`delete` require a non-empty reason in the body; missing/empty reason returns a client error (basic validation here; full Zod schemas come in Phase 4, so simple manual checks are acceptable now as long as they work).
- Soft delete only: `DELETE /api/tasks/:id` sets `status=DELETED`, `deletion_reason`, `deleted_at` — the row is never removed from the table.

## Out of scope
- No dedicated Zod validation layer yet (basic inline checks are fine; Phase 4 formalizes this).
- No centralized error-handling refinement beyond what Phase 0 set up (Phase 4).
- No deep authorization hardening/security review (Phase 5) — but do not skip basic ownership scoping; that's a baseline requirement here, not an enhancement.
- No automatic missed-task sweep (Phase 6).
- No tests yet (Phase 7) — manual verification is enough for this phase, though the user may ask for a quick manual smoke test.

## Files/areas to create or change
- `server/src/routes/tasks.js`
- `server/src/controllers/tasksController.js`
- `server/src/services/tasksService.js`
- `server/src/repositories/tasksRepository.js`
- `server/src/repositories/usersRepository.js` (find-or-create by `clerk_user_id`)
- Update `server/src/app.js` to mount task routes under `/api/tasks`.

## Acceptance criteria
- [ ] All seven endpoints implemented and reachable under `/api` (no `/v1`).
- [ ] `POST /api/tasks` creates a task owned by the authenticated user's internal `users.id`.
- [ ] `GET /api/tasks` lists only the authenticated user's tasks, with working `?status=` filtering.
- [ ] `GET /api/tasks/:id` returns 404 (or 403, pick one and be consistent) for tasks not owned by the requester.
- [ ] `PATCH /api/tasks/:id` only allows editing `title`/`description`/`deadline`/`priority`, only on ACTIVE tasks; other fields are ignored or rejected.
- [ ] `POST /api/tasks/:id/complete` only works on ACTIVE tasks, sets `status=COMPLETED`, `completed_at`, `updated_at`.
- [ ] `POST /api/tasks/:id/miss` requires a non-empty reason, only works on ACTIVE tasks, sets `status=MISSED`, `missed_reason`, `missed_at`, `updated_at`.
- [ ] `DELETE /api/tasks/:id` requires a non-empty reason, only works on ACTIVE tasks, soft-deletes (row remains), sets `status=DELETED`, `deletion_reason`, `deleted_at`, `updated_at`.
- [ ] Invalid transitions (e.g. completing an already-completed task) are rejected with a clear client error, not a 500.
- [ ] All SQL is parameterized — no string interpolation of user input.
- [ ] `users` find-or-create by `clerk_user_id` works correctly and transparently.
- [ ] `STATE.md` updated: Phase 3 marked `Done`, next phase noted, decisions logged (e.g. 404 vs 403 for foreign tasks).
