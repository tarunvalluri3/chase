# Phase 6 — Automatic Task Status Handling

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 6"). On completion, update `STATE.md` and stop — do not proceed to Phase 7 without separate approval.

## Goal
Make overdue ACTIVE tasks automatically become MISSED, without introducing infrastructure (no Redis, Kafka, BullMQ, background workers, k8s, or microservices), and without ever overwriting a COMPLETED task.

## Chosen mechanism (documented here per project convention)
Keep it simple, in-process, and dependency-free:

1. **Lazy check on read (primary mechanism).** Whenever tasks are read (`GET /api/tasks`, `GET /api/tasks/:id`), the service layer checks each returned ACTIVE task's `deadline` against the current UTC time. If `deadline < now` and `status = ACTIVE`, the service transitions it to MISSED as part of handling that read request (auto-generated `missed_reason`, e.g. `"Automatically marked missed: deadline passed"`, plus `missed_at`, `updated_at`), persists the change, and returns the updated task. This guarantees the client never sees a stale ACTIVE task past its deadline, with zero added infrastructure.
2. **Simple periodic sweep (secondary, optional, additive).** A lightweight sweep function (e.g. `sweepMissedTasks()`) that runs a single `UPDATE tasks SET status='MISSED', missed_reason=..., missed_at=now(), updated_at=now() WHERE status='ACTIVE' AND deadline < now()` in one parameterized query. In this phase, expose it only as a callable service function (and optionally a `POST /api/tasks/sweep-missed` admin-style endpoint scoped to the authenticated user's own tasks, if the user wants one) — do NOT wire up `setInterval`, cron, or any external scheduler yet. That wiring is explicitly deferred to a future phase (see Phase 26 in `PHASES.md`) so today's implementation stays framework-free but is structured so a scheduler can call this same function later without rework.

Both paths share one service function so there is a single source of truth for "what counts as missed."

## In scope
- Implement the lazy-check-on-read logic in the tasks service, applied to `GET /api/tasks` and `GET /api/tasks/:id`.
- Implement the shared `sweepMissedTasks` logic (single parameterized bulk UPDATE, scoped correctly — if exposed via an endpoint, scoped to the authenticated user only).
- Guarantee idempotency and correctness: the transition only ever applies to `ACTIVE` tasks whose `deadline` has passed; it must never touch `COMPLETED`, already-`MISSED`, or `DELETED` tasks.
- Ensure `updated_at`, `missed_at`, and `missed_reason` are set correctly and consistently between the lazy path and the sweep path.
- Ensure this logic still respects ownership scoping from Phase 5.

## Out of scope
- No cron/scheduler/background worker wiring (explicitly deferred — see mechanism note above and Phase 26 in `PHASES.md`).
- No new infrastructure (Redis, Kafka, BullMQ, k8s, microservices) — this is a hard constraint, not a suggestion.
- No frontend changes.
- No changes to the manual `POST /api/tasks/:id/miss` endpoint's behavior (user-supplied reason) — this phase only adds the automatic path for passed deadlines, it doesn't change the manual one.

## Files/areas to create or change
- `server/src/services/tasksService.js` — add the lazy-check logic to read paths, add a shared `sweepMissedTasks` function.
- `server/src/repositories/tasksRepository.js` — add a parameterized bulk-update query for the sweep, and ensure single-task read/update paths support the lazy transition.
- Optionally `server/src/routes/tasks.js` + `server/src/controllers/tasksController.js` if the user wants a callable sweep endpoint scoped to their own tasks.

## Acceptance criteria
- [ ] Reading tasks (`GET /api/tasks`, `GET /api/tasks/:id`) never returns an ACTIVE task whose deadline has passed without first transitioning it to MISSED.
- [ ] The automatic transition sets `status=MISSED`, `missed_reason` (auto-generated, clearly distinguishable from a manually supplied reason), `missed_at`, `updated_at`.
- [ ] `sweepMissedTasks` correctly bulk-updates only eligible rows (`ACTIVE` + deadline passed) using a single parameterized query.
- [ ] COMPLETED tasks are never touched by either path, under any circumstance, including tasks completed after their deadline.
- [ ] MISSED and DELETED tasks are never touched by either path (no double-processing).
- [ ] All logic remains scoped to the authenticated user where exposed via an endpoint.
- [ ] No new runtime infrastructure/dependencies introduced.
- [ ] `STATE.md` updated: Phase 6 marked `Done`, next phase noted, this phase's mechanism choice reaffirmed in the Decisions log along with a pointer that scheduler wiring is deferred to a future phase.
