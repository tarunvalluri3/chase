# Phase 3 — Core Task REST API

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 3"). On completion, update `STATE.md` and stop — do not proceed to Phase 4 without separate approval.

## Goal
Build the full task REST API end-to-end through all layers (route → middleware → controller → service → repository → Supabase), implementing create, list, get-one, edit, complete, and soft-delete, with correct lifecycle enforcement.

## A note on MISSED and INCOMPLETE (read before implementing)
`MISSED` (and, once Phase 6 adds it, `INCOMPLETE`) are part of the `status` value set, and `MISSED`/`INCOMPLETE` both appear in this phase's `?status=` filter, but **this phase does not implement any way to create a MISSED or INCOMPLETE task.** There is no user-facing "mark as missed" action and no manual `/miss` endpoint. `MISSED` means "the deadline passed while the task was still ACTIVE" — an automatic, system-detected checkpoint, not something a user declares about their own task. `INCOMPLETE` is the explicit, user-confirmed "this genuinely wasn't done" verdict, reached only by resolving a MISSED task. Both the automatic ACTIVE→MISSED transition and the resolve-missed flow (MISSED→INCOMPLETE or MISSED→COMPLETED) are Phase 6's job, not this phase's — Phase 6 also adds the `INCOMPLETE` value to the `status` CHECK constraint via a follow-up migration, since it doesn't exist yet at the end of Phase 2. Build this phase so a task can only ever leave ACTIVE via `complete` or the soft-delete endpoint below; do not add a `miss` endpoint here.

## In scope
- Implement the endpoint set from `CLAUDE.md`:
  - `POST /api/tasks`
  - `GET /api/tasks` (supports `?status=ACTIVE|COMPLETED|MISSED|DELETED` for now — `INCOMPLETE` is added to the filter's valid values in Phase 6, alongside the migration that adds it to the schema)
  - `GET /api/tasks/:id`
  - `PATCH /api/tasks/:id`
  - `POST /api/tasks/:id/complete`
  - `DELETE /api/tasks/:id` (body: `{ "reason": "..." }`)
- Build out the layers properly:
  - Routes: wire endpoints, apply auth middleware from Phase 1.
  - Controllers: thin — parse request, call service, shape HTTP response.
  - Services: hold all business/state-transition logic. The only transitions this phase implements are `ACTIVE→COMPLETED` and `ACTIVE→DELETED`. (`ACTIVE→MISSED` and `MISSED→COMPLETED` are introduced by Phase 6 — see note above. Do not implement them here, but do not write service code that would actively prevent Phase 6 from adding them later, e.g. don't hardcode an exhaustive switch that would need restructuring rather than extending.)
  - Repositories: parameterized SQL only, using the connection pool from Phase 2.
- Ensure every task is scoped to the authenticated user (basic ownership — deeper security hardening is Phase 5, but this phase must not ship code that ignores ownership).
- Ensure the `users` table is populated/looked-up correctly: on first authenticated request, find-or-create the internal `users` row keyed by `clerk_user_id`, and use the internal `users.id` as the FK for tasks (never the Clerk id directly).
- Enforce field-level rules on PATCH: only `title`, `description`, `deadline`, `priority` are editable, only on ACTIVE tasks; reject attempts to set `user_id`, `status`, timestamps, `missed_reason`, `deletion_reason`.
- Enforce reason requirements: soft-`delete` requires a non-empty reason in the body; missing/empty reason returns a client error (basic validation here; full Zod schemas come in Phase 4, so simple manual checks are acceptable now as long as they work).
- Soft delete only: `DELETE /api/tasks/:id` sets `status=DELETED`, `deletion_reason`, `deleted_at` — the row is never removed from the table.

## Out of scope
- No dedicated Zod validation layer yet (basic inline checks are fine; Phase 4 formalizes this).
- No centralized error-handling refinement beyond what Phase 0 set up (Phase 4).
- No deep authorization hardening/security review (Phase 5) — but do not skip basic ownership scoping; that's a baseline requirement here, not an enhancement.
- No automatic missed-task detection, no `MISSED` state, no missed-resolution flow (all of `ACTIVE→MISSED` and `MISSED→COMPLETED`/`MISSED→MISSED` are Phase 6).
- No tests yet (Phase 7) — manual verification is enough for this phase, though the user may ask for a quick manual smoke test.

## Files/areas to create or change
- `server/src/routes/tasks.js`
- `server/src/controllers/tasksController.js`
- `server/src/services/tasksService.js`
- `server/src/repositories/tasksRepository.js`
- `server/src/repositories/usersRepository.js` (find-or-create by `clerk_user_id`)
- Update `server/src/app.js` to mount task routes under `/api/tasks`.

## Acceptance criteria
- [ ] All six endpoints implemented and reachable under `/api` (no `/v1`).
- [ ] `POST /api/tasks` creates a task owned by the authenticated user's internal `users.id`.
- [ ] `GET /api/tasks` lists only the authenticated user's tasks, with working `?status=` filtering (including `?status=MISSED`, even though nothing can produce a MISSED task until Phase 6 — the filter should still work, just return an empty set for now). `INCOMPLETE` is not yet a valid filter value in this phase — it's added in Phase 6 along with the schema change that introduces it.
- [ ] `GET /api/tasks/:id` returns 404 (or 403, pick one and be consistent) for tasks not owned by the requester.
- [ ] `PATCH /api/tasks/:id` only allows editing `title`/`description`/`deadline`/`priority`, only on ACTIVE tasks; other fields are ignored or rejected.
- [ ] `POST /api/tasks/:id/complete` only works on ACTIVE tasks, sets `status=COMPLETED`, `completed_at`, `updated_at`.
- [ ] `DELETE /api/tasks/:id` requires a non-empty reason, only works on ACTIVE tasks, soft-deletes (row remains), sets `status=DELETED`, `deletion_reason`, `deleted_at`, `updated_at`.
- [ ] There is no `/miss` endpoint and no way for a client to directly set `status=MISSED`.
- [ ] Invalid transitions (e.g. completing an already-completed task) are rejected with a clear client error, not a 500.
- [ ] All SQL is parameterized — no string interpolation of user input.
- [ ] `users` find-or-create by `clerk_user_id` works correctly and transparently.
- [ ] `STATE.md` updated: Phase 3 marked `Done`, next phase noted, decisions logged (e.g. 404 vs 403 for foreign tasks).
