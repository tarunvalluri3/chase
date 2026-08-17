# Phase 6 — Automatic Task Status Handling

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 6"). On completion, update `STATE.md` and stop — do not proceed to Phase 7 without separate approval.

## Goal
Make overdue ACTIVE tasks automatically become MISSED, and give the user a way to resolve a MISSED task afterward — confirming either that it genuinely was never completed (with a reason), or that it actually was completed and the user simply forgot to press Complete before the deadline. Do this without introducing infrastructure (no Redis, Kafka, BullMQ, background workers, k8s, or microservices), and without ever overwriting a COMPLETED or DELETED task.

## Product behavior (read before implementing)

`MISSED` does **not** mean "the user never did the work." It means exactly one thing:

> "The deadline passed without the system receiving a completion confirmation."

A user can easily complete real work and simply forget to tap "Complete" before the deadline ticks over. Treating an overdue ACTIVE task as permanently, definitively incomplete the moment its deadline passes would misrepresent what actually happened and would corrupt the historical data this app is built to preserve (`CLAUDE.md`'s "Plan → Execute → Record → Understand → Improve" arc depends on that history being accurate). So MISSED is a checkpoint, not a verdict — it is always followed by a user decision, and that decision lands on one of two genuinely distinct outcomes with their own status:

```
ACTIVE
  ├─ user marks Complete            → COMPLETED
  ├─ user deletes                   → DELETED
  └─ deadline passes while ACTIVE   → MISSED   (automatic, this phase; pending resolution)

MISSED
  ├─ user resolves, with reason: "I never completed it"        → INCOMPLETE  (terminal)
  └─ user resolves: "I actually completed it, forgot to mark it" → COMPLETED   (terminal)
```

`COMPLETED` and `DELETED` remain terminal exactly as before — nothing in this phase changes that. `MISSED` is a transient, pending-resolution status: every MISSED task must eventually be resolved to either `INCOMPLETE` (the genuine "never completed" verdict) or `COMPLETED`. `INCOMPLETE` is a new terminal status introduced in this phase — it is not the same thing as `MISSED`. Conflating the two is exactly the mistake this phase exists to correct: `MISSED` = "system detected an unconfirmed deadline," `INCOMPLETE` = "user confirmed, with a reason, that it genuinely wasn't done."

## Schema change required
`INCOMPLETE` does not exist in the `status` CHECK constraint created in Phase 2, and there are no columns yet to hold the user's incomplete-reason. This phase includes a follow-up Supabase migration (same flow as Phase 2 — plain SQL under `server/supabase/migrations/`, applied via the Supabase SQL editor or CLI, reviewable in-repo) that:
- Widens the `status` CHECK constraint to `ACTIVE | COMPLETED | MISSED | INCOMPLETE | DELETED`.
- Adds `incomplete_reason` (text, nullable) and `incomplete_at` (timestamptz, nullable) columns to `tasks`.

`missed_reason`/`missed_at` (from Phase 2) are unchanged and are **not** repurposed to hold the user's incomplete-reason — they stay as the automatic, system-generated record of when/why the task was first detected overdue. `incomplete_reason`/`incomplete_at` are separate columns holding the user's own account, set only when a MISSED task is resolved as INCOMPLETE. Both pairs persist independently and are never cleared by later transitions, so a task's full history (auto-detected overdue → user's own explanation) is always reconstructable.

## Chosen mechanism for the automatic ACTIVE → MISSED transition
Keep it simple, in-process, and dependency-free:

1. **Lazy check on read (primary mechanism).** Whenever tasks are read (`GET /api/tasks`, `GET /api/tasks/:id`), the service layer checks each returned ACTIVE task's `deadline` against the current UTC time. If `deadline < now` and `status = ACTIVE`, the service transitions it to MISSED as part of handling that read request — sets `status=MISSED`, an auto-generated `missed_reason` (e.g. `"Deadline passed while task was still ACTIVE"` — clearly distinguishable from any user-authored text), `missed_at`, `updated_at` — persists the change, and returns the updated task. This guarantees the client never sees a stale ACTIVE task past its deadline, with zero added infrastructure.
2. **Simple periodic sweep (secondary, optional, additive).** A lightweight sweep function (e.g. `sweepMissedTasks()`) that runs a single `UPDATE tasks SET status='MISSED', missed_reason=..., missed_at=now(), updated_at=now() WHERE status='ACTIVE' AND deadline < now()` in one parameterized query. In this phase, expose it only as a callable service function (and optionally a `POST /api/tasks/sweep-missed` endpoint scoped to the authenticated user's own tasks, if the user wants one) — do NOT wire up `setInterval`, cron, or any external scheduler yet. That wiring is explicitly deferred to a future phase (see Phase 26 in `PHASES.md`) so today's implementation stays framework-free but is structured so a scheduler can call this same function later without rework.

Both paths share one service function so there is a single source of truth for "what counts as missed."

## Missed-task resolution — API contract

A dedicated endpoint, separate from every other lifecycle action:

```
POST /api/tasks/:id/resolve-missed
Body: { "resolution": "INCOMPLETE", "reason": "..." } | { "resolution": "COMPLETED" }
```

Rules:
- Requires authentication (Phase 1) and is ownership-scoped exactly like every other task endpoint (Phase 5) — a user can only resolve their own MISSED tasks; a foreign or nonexistent task id returns the same not-found-style response as the rest of the API (no existence/ownership leakage).
- Only callable on a task whose current `status` is `MISSED`. Calling it on an `ACTIVE`, `COMPLETED`, `INCOMPLETE`, or `DELETED` task is an invalid transition and must be rejected with a clear client error (`409`, consistent with how other invalid transitions are handled per `CLAUDE.md`/Phase 4), not a `500`.
- `resolution` must be exactly `"INCOMPLETE"` or `"COMPLETED"` — validated with Zod alongside the rest of the validation layer from Phase 4 (extend `server/src/validation/taskSchemas.js`); any other value (wrong case, typo, missing body) is a `400` with a clear message.
- **`resolution: "INCOMPLETE"`** — the user confirms the task genuinely was never completed.
  - Requires a non-empty `reason` in the same request body (same "reject empty/meaningless reasons with 400" rule `CLAUDE.md` already applies to delete) — this is the user's own account of what happened, distinct from the auto-generated `missed_reason`.
  - `status` changes `MISSED → INCOMPLETE`. Sets `incomplete_reason` (from the request), `incomplete_at` (server time), `updated_at`.
  - The existing `missed_reason`/`missed_at` (set automatically when the task first became MISSED) are kept as-is, untouched — the historical record of the automatic detection.
  - Terminal: once resolved as INCOMPLETE, the task cannot be resolved again or transitioned further (no edit, no delete, no re-resolution).
- **`resolution: "COMPLETED"`** — the user confirms the work was actually done, they just forgot to mark it before the deadline. No `reason` is required or accepted for this outcome (a `.strict()` Zod schema should reject a stray `reason` field here, keeping the two branches unambiguous).
  - `status` changes `MISSED → COMPLETED`.
  - `completed_at` is set (server-controlled, current UTC time).
  - `updated_at` is updated.
  - `missed_at` and `missed_reason` are **not** cleared or overwritten — they remain as retained history showing this task passed through MISSED before being confirmed complete. `incomplete_reason`/`incomplete_at` stay `null` in this branch, since the task was never actually confirmed incomplete.
  - Terminal: once resolved as COMPLETED, ordinary lifecycle rules apply again — it's now a normal COMPLETED task and cannot be edited or transitioned further (see `CLAUDE.md` Lifecycle Rules).

## In scope
- Write and apply the schema migration described above (status CHECK widened to include `INCOMPLETE`; `incomplete_reason`/`incomplete_at` columns added).
- Implement the lazy-check-on-read logic in the tasks service, applied to `GET /api/tasks` and `GET /api/tasks/:id`.
- Implement the shared `sweepMissedTasks` logic (single parameterized bulk UPDATE, scoped correctly — if exposed via an endpoint, scoped to the authenticated user only).
- Implement `POST /api/tasks/:id/resolve-missed` end-to-end (route → validation → controller → service → repository) per the contract above, including the reason requirement for the INCOMPLETE branch.
- Update `GET /api/tasks`'s `?status=` filter to accept `INCOMPLETE` as a valid value.
- Guarantee idempotency and correctness for the automatic transition: it only ever applies to `ACTIVE` tasks whose `deadline` has passed; it must never touch `COMPLETED`, `INCOMPLETE`, already-`MISSED`, or `DELETED` tasks.
- Ensure `updated_at`, `missed_at`, `missed_reason`, `incomplete_at`, and `incomplete_reason` are all set correctly and consistently.
- Ensure all of this still respects ownership scoping from Phase 5.

## Out of scope
- No cron/scheduler/background worker wiring (explicitly deferred — see mechanism note above and Phase 26 in `PHASES.md`).
- No new infrastructure (Redis, Kafka, BullMQ, k8s, microservices) — this is a hard constraint, not a suggestion.
- No frontend changes.
- No manual "mark as missed" endpoint or action of any kind — MISSED is exclusively system-generated by the automatic deadline check. There is no `POST /api/tasks/:id/miss` in this API (see Phase 3's note on this); do not reintroduce it here.
- No restore/undo of a MISSED resolution (INCOMPLETE or COMPLETED), and no way to move a task back to MISSED or ACTIVE once resolved — resolution is one-way in both directions, matching the terminal-state philosophy already established for COMPLETED/DELETED in `CLAUDE.md`.

## Files/areas to create or change
- `server/supabase/migrations/*.sql` — new migration: widen `status` CHECK to include `INCOMPLETE`; add `incomplete_reason` (text, nullable) and `incomplete_at` (timestamptz, nullable) to `tasks`.
- `server/src/services/tasksService.js` — add the lazy-check logic to read paths, add a shared `sweepMissedTasks` function, add `resolveMissedTask` business logic (validates current status is MISSED, branches on resolution).
- `server/src/repositories/tasksRepository.js` — add a parameterized bulk-update query for the sweep, ensure single-task read/update paths support the lazy transition and the resolve-missed update.
- `server/src/validation/taskSchemas.js` — add a discriminated schema for the `resolve-missed` body (`resolution: "INCOMPLETE"` requires non-empty `reason`; `resolution: "COMPLETED"` accepts no extra fields); add `INCOMPLETE` to `listQuerySchema`'s status enum.
- `server/src/routes/tasks.js` + `server/src/controllers/tasksController.js` — wire up `POST /api/tasks/:id/resolve-missed`; optionally a callable sweep endpoint scoped to the user's own tasks.

## Acceptance criteria
- [ ] Migration applied: `status` CHECK constraint includes `INCOMPLETE`; `incomplete_reason`/`incomplete_at` columns exist on `tasks`, verified in Supabase.
- [ ] Reading tasks (`GET /api/tasks`, `GET /api/tasks/:id`) never returns an ACTIVE task whose deadline has passed without first transitioning it to MISSED.
- [ ] The automatic transition sets `status=MISSED`, an auto-generated `missed_reason` (clearly distinguishable from user-authored text), `missed_at`, `updated_at`.
- [ ] `sweepMissedTasks` correctly bulk-updates only eligible rows (`ACTIVE` + deadline passed) using a single parameterized query.
- [ ] `GET /api/tasks?status=INCOMPLETE` correctly filters to incomplete tasks.
- [ ] `POST /api/tasks/:id/resolve-missed` is authenticated and ownership-scoped; a foreign or nonexistent task id gets the same not-found-style response.
- [ ] `resolve-missed` only succeeds on a task currently `MISSED`; calling it on ACTIVE/COMPLETED/INCOMPLETE/DELETED tasks is rejected as an invalid transition (`409`), not a `500`.
- [ ] An invalid/missing `resolution` value is rejected with `400` and a clear message.
- [ ] `resolution: "INCOMPLETE"` without a non-empty `reason` is rejected with `400`.
- [ ] `resolution: "INCOMPLETE"` with a valid reason moves the task to `status=INCOMPLETE`, sets `incomplete_reason`/`incomplete_at`/`updated_at`, leaves the original `missed_reason`/`missed_at` intact, and is terminal.
- [ ] `resolution: "COMPLETED"` moves the task to `COMPLETED`, sets `completed_at`, updates `updated_at`, does **not** clear `missed_at`/`missed_reason`, and leaves `incomplete_reason`/`incomplete_at` null.
- [ ] COMPLETED and INCOMPLETE tasks are never touched by the automatic missed-detection paths, under any circumstance, including tasks completed after their deadline.
- [ ] DELETED tasks are never touched by the automatic missed-detection paths.
- [ ] Already-MISSED tasks are never re-processed by the automatic missed-detection paths (no double-processing).
- [ ] All logic remains scoped to the authenticated user where exposed via an endpoint.
- [ ] No new runtime infrastructure/dependencies introduced.
- [ ] `STATE.md` updated: Phase 6 marked `Done`, next phase noted, this phase's mechanism choice, the schema migration, and the missed-resolution design reaffirmed in the Decisions log, along with a pointer that scheduler wiring is deferred to a future phase.
