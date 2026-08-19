# PHASE_18.md — Time Tracking

> Documentation only. Not implemented. Do not build until the user gives explicit approval ("Approved — build Phase 18"), per `CLAUDE.md`'s governing rule. Depends conceptually on Phase 17 only in that both extend `tasksService`'s lifecycle methods with a side effect — they are otherwise independent and could be built in either order.

## 1. Architecture

Same layered shape as everything else in the backend (`CLAUDE.md`'s Route → Middleware → Controller → Service → Repository → Supabase):

```
server/src/routes/workSessions.js         — nested under /api/tasks/:id/sessions
server/src/controllers/workSessionsController.js
server/src/services/workSessionsService.js   — start/pause/resume/stop rules, total-time math
server/src/repositories/workSessionsRepository.js  — Supabase calls only
server/src/validation/workSessionSchemas.js  — Zod, param validation only (no body fields —
                                                every timestamp is server-controlled)
```

`tasksService`'s `completeTask`, `deleteTask`, and the internal `maybeTransitionToMissed` gain one new call each into `workSessionsService.autoCloseOpenSession(taskId)` (see §5) — the one place this phase's logic reaches into existing, already-shipped code.

## 2. Database changes

A dedicated **segment-based** `work_sessions` table, not one row per logical "session" with multiple pause/resume timestamp columns crammed into it — a row instead represents one *continuous stretch of active work*. Pausing ends the current segment; resuming (or starting) opens a new one. Total time on a task is simply the sum of `(ended_at - started_at)` across all its segments — no separate accumulator field to keep in sync.

```sql
create table work_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id),
  user_id uuid not null references users (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('PAUSED', 'STOPPED', 'AUTO_STOPPED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_sessions_ended_reason_consistent
    check ((ended_at is null and end_reason is null) or (ended_at is not null and end_reason is not null))
);

create index work_sessions_task_id_idx on work_sessions (task_id);
create index work_sessions_user_id_idx on work_sessions (user_id);
create unique index work_sessions_one_open_per_task
  on work_sessions (task_id) where ended_at is null;
```

`user_id` is denormalized onto `work_sessions` (not derived only via a join through `tasks`) for the same reason `CLAUDE.md` already scopes every task query directly by `user_id` — every ownership check and every listing query can filter directly on the session row without a join, matching the rest of the codebase's pattern.

The partial unique index (`... where ended_at is null`) is the actual invalid-state guard, enforced at the database level, not just in `workSessionsService` — "multiple active sessions on one task" becomes a constraint violation, not just an application-level bug waiting to happen under a race.

`Task → Work Session → Work Session → Work Session` from the prompt maps directly: each `work_sessions` row is one child segment; a task's full time-tracking history is `select * from work_sessions where task_id = ? order by started_at`.

## 3. API endpoints

```
POST   /api/tasks/:id/sessions/start
POST   /api/tasks/:id/sessions/pause
POST   /api/tasks/:id/sessions/resume
POST   /api/tasks/:id/sessions/stop
GET    /api/tasks/:id/sessions           # full segment history, chronological
GET    /api/tasks/:id/sessions/summary   # { totalSeconds, isRunning, currentSessionStartedAt }
```

Nested under the existing task-ownership pattern (`:id` is the task id — every route first resolves the task via the same `getOwnedTaskOrThrow`-style check `tasksService` already uses, so a session on someone else's task 404s exactly like a task on someone else's task does). No request bodies on any of the four action endpoints — matching `CLAUDE.md`'s existing rule that lifecycle timestamps are always server-controlled, never client-supplied.

`GET /sessions/summary` is a derived read, not a stored value — `totalSeconds` is computed by summing closed segments plus, if a segment is currently open, the elapsed time from `started_at` to "now" at request time.

## 4. Session lifecycle

```
(no open segment)
   │
   ├─ Start   → open segment created                         [requires: task ACTIVE, no open segment]
   │
(open segment, RUNNING)
   │
   ├─ Pause   → segment closed, end_reason = PAUSED            [requires: an open segment exists]
   │
(no open segment, most recent segment's end_reason = PAUSED)
   │
   ├─ Resume  → new segment created                            [requires: task ACTIVE, no open segment,
   │                                                              most recent segment was PAUSED]
   │
(open segment, RUNNING)
   │
   └─ Stop    → segment closed, end_reason = STOPPED            [requires: an open segment exists]
```

Start and Resume both "open a new segment" mechanically — they are kept as two distinct endpoints (matching the prompt's explicit Start/Pause/Resume/Stop framing, and `CLAUDE.md`'s established one-dedicated-endpoint-per-transition convention) but differ in their precondition: Start is valid any time there's no open segment (including the very first time, or after a prior Stop — "track multiple work sessions" means a task can be started, stopped, and started again later), while Resume additionally requires that the task's most recent segment ended specifically with `PAUSED` — calling Resume on a task that was never paused (or was last Stopped) is a `409`, same status code family `CLAUDE.md` already uses for invalid task-status transitions.

A task can accumulate any number of Start→(Pause→Resume)*→Stop cycles over its lifetime; each Start/Resume produces one new `work_sessions` row.

## 5. Interaction with task status

- **ACTIVE:** the only status Start/Resume are ever allowed on, matching every other mutating task action in `CLAUDE.md` (Edit, Complete, Delete are all ACTIVE-only already).
- **COMPLETED / DELETED / (auto) MISSED:** if a session is currently open (`RUNNING`) at the moment a task leaves ACTIVE — via `completeTask`, `deleteTask`, or the lazy/scheduled `ACTIVE→MISSED` transition — that open segment is auto-closed with `end_reason = 'AUTO_STOPPED'` as part of the same operation. This is the one new coupling between `tasksService` and `workSessionsService`: each of those three code paths gains one call to `workSessionsService.autoCloseOpenSession(taskId)` immediately alongside its status write. Rationale: a `RUNNING` session on a task that is no longer `ACTIVE` is exactly the kind of invalid state §"Prevent invalid session states" calls out — leaving it open would mean `GET /sessions/summary` keeps counting elapsed time against a task nobody can be working on anymore.
  - **Flagged as a decision to confirm, not assumed silently:** this auto-close is a genuine cross-service side effect layered onto already-shipped, already-tested `tasksService` methods. The alternative — leave the session open and treat "task status != ACTIVE" as an implicit stop when computing totals — avoids touching existing code but leaves a permanently-`RUNNING`-looking row in the data, which reads worse for the "preserve meaningful history" analytics goal `CLAUDE.md` states as this project's long-term arc. This document recommends the auto-close approach; either is buildable.
- **MISSED (the pending-checkpoint window itself):** no new segment can start or resume while a task is `MISSED` (it isn't `ACTIVE`), consistent with `CLAUDE.md`'s existing "a MISSED task cannot be edited" rule. If the task is later resolved back to `COMPLETED` via `resolve-missed`, no new session-related action follows — the auto-close already happened when it first became `MISSED`.
- **INCOMPLETE / DELETED (terminal):** fully frozen, same as every other field on a terminal task — session rows are never edited or deleted, they remain as historical record even for a soft-deleted task, exactly like `deletion_reason`/`missed_reason` are preserved forever per `CLAUDE.md`'s data model.

## 6. Validation

- `:id` (task id) validated as a UUID via the existing `idParamSchema` pattern from `server/src/validation/taskSchemas.js`, reused rather than duplicated.
- No request-body schemas needed for the four action endpoints — there is no client-writable field.
- Service-layer checks (not Zod, since they're state-dependent, matching how `tasksService` already splits "shape validation via Zod" from "business-rule validation via the service layer" per the Phase 4 decisions log): task must be owned by the caller, task must be `ACTIVE` for Start/Resume, an open segment must/must-not exist per the table in §4.

## 7. Security

- Every session route first resolves and ownership-checks the parent task exactly like every existing task route does — a session action on a task id that exists but belongs to another user returns `404`, identically to how a foreign task id already 404s elsewhere in the API (no new leak surface, no new code path that could differ in status/timing/message from the existing pattern).
- `user_id` on `work_sessions` is always taken from the authenticated session (`getAuth(req)` → internal user id), never from any request input — there is no request input that could carry one, since none of the six endpoints accept a body.
- `GET /sessions` and `GET /sessions/summary` are similarly scoped — a user can only ever read their own task's sessions.

## 8. Testing requirements

- **Lifecycle:** Start → Pause → Resume → Stop happy path, asserting the resulting segment rows and computed total.
- **Invalid-state rejections (409):** Start while a session is already open; Pause/Stop with no open session; Resume when the most recent segment was `STOPPED` (not `PAUSED`) or when no segment exists yet; any action on a non-`ACTIVE` task.
- **Ownership:** the same cross-user-access battery the existing task tests already run (`server/tests/`), applied to all six session endpoints — confirms `404`, not `403`, and no field/state leakage.
- **Auto-close:** an open session on a task that is then Completed / Deleted / auto-transitioned to Missed ends up closed with `end_reason = 'AUTO_STOPPED'`, and no further session action is possible on that task afterward.
- **Summary math:** multiple closed segments plus one currently-open segment sum correctly in `GET /sessions/summary`; a task with zero sessions returns `{ totalSeconds: 0, isRunning: false, currentSessionStartedAt: null }` rather than an error.
- Reuses the existing Vitest + Supertest setup (`server/tests/setup.js`'s mocked Clerk auth, `server/tests/helpers/` db cleanup) rather than introducing a new test harness.

## 9. Acceptance criteria

- [ ] `work_sessions` migration applied, including the partial unique index enforcing at most one open segment per task at the database level.
- [ ] All six endpoints implemented, ownership-scoped, and returning correct status codes for every valid and invalid transition in §4.
- [ ] Starting/resuming is rejected on any non-`ACTIVE` task.
- [ ] The auto-close behavior in §5 is implemented (pending the decision flagged there being confirmed with the user) and covered by tests.
- [ ] `GET /sessions/summary` returns a correct, derived (not stored) total across multiple segments including one still open.
- [ ] No schema field or endpoint assumes a single-segment-per-task model — multiple full Start→Stop cycles on the same task are supported and tested.
- [ ] Full backend test suite (existing tests plus this phase's new ones) passes.
- [ ] `STATE.md` updated: Phase 18 marked `Done`, with the auto-close decision's actual resolution logged.

