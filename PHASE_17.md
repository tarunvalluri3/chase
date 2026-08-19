# PHASE_17.md — Notifications & Email

> Documentation only. Not implemented. Do not build until the user gives explicit approval ("Approved — build Phase 17"), per `CLAUDE.md`'s governing rule.

## 1. Architecture

Email is added as its own concern, kept out of controllers and out of `tasksService`'s core lifecycle logic, per `CLAUDE.md`'s layered architecture:

```
tasksService (calls out, fire-and-forget-safe)
      │
      ▼
notificationService     — orchestration: which email, for which event, dedup + logging
      │                    (server/src/services/notificationService.js)
      ├──▶ notificationTemplates  — pure functions: event → { subject, html, text }
      │      (server/src/services/notificationTemplates.js)
      │
      ├──▶ emailService   — thin Resend wrapper: send one email, nothing else
      │      (server/src/services/emailService.js)
      │
      └──▶ notificationsRepository — Supabase calls only, against notification_log
             (server/src/repositories/notificationsRepository.js)

clerkService              — fetches a Clerk user's email address
  (server/src/services/clerkService.js)

notificationScheduler     — in-process interval loop for missed-sweep + reminders
  (server/src/jobs/notificationScheduler.js, started once from src/index.js)
```

`tasksService` gains calls to `notificationService` at the points listed in §2, but never `await`s them in a way that can turn an email failure into a failed task operation (see §6).

## 2. Notification types & triggers

| Type | Trigger | Timing |
|---|---|---|
| `TASK_CREATED` | `tasksService.createTask` succeeds | Immediate (event-driven) |
| `TASK_COMPLETED` | `tasksService.completeTask`, or `resolveMissedTask` with `resolution: 'COMPLETED'` | Immediate |
| `TASK_INCOMPLETE` | `tasksService.resolveMissedTask` with `resolution: 'INCOMPLETE'` | Immediate |
| `TASK_DELETED` | `tasksService.deleteTask` succeeds | Immediate |
| `TASK_UPDATED` | `tasksService.editTask` succeeds **and** `deadline` or `priority` actually changed (a title/description-only edit does not send an email) | Immediate |
| `TASK_MISSED` | A task is currently `MISSED` and has no prior `TASK_MISSED` log row | Scheduled sweep only (see §4) — **not** the lazy per-request `ACTIVE→MISSED` check, so opening the app never fires an email mid-request |
| `DEADLINE_REMINDER` | An `ACTIVE` task's deadline falls inside the reminder window and has no prior `DEADLINE_REMINDER` log row for that window | Scheduled sweep only |

`TASK_INCOMPLETE` is not in the prompt's literal example list ("completed, missed, deleted, deadline/priority changes") but is the terminal negative-verdict counterpart to `TASK_COMPLETED` — flagged in §8 as a call to confirm at approval time, not assumed silently.

Decoupling `TASK_MISSED` from the existing lazy `maybeTransitionToMissed` check (in `tasksService.js`) is deliberate: that check runs on every `GET /api/tasks*`, and firing an email from inside a read request is the wrong place for a side effect like this. The scheduled sweep becomes the single source of truth for "has this task's missed-email been sent," regardless of whether the status flip itself happened lazily (a user loaded the app) or via the sweep's own cross-user `ACTIVE→MISSED` pass.

## 3. Database changes

**`users` gains one column** (migration, applied the same by-hand-through-the-Supabase-SQL-editor way as every prior migration):

```sql
alter table users add column email text;
```

Nullable, cached from Clerk rather than fetched live on every send — the scheduled sweep may need to email many users in one pass, and a cached column avoids one Clerk API call per user per sweep tick. Synced in `usersRepository.findOrCreateByClerkUserId` (which already fetches-or-creates the row) by also fetching the Clerk user's primary email via `clerkService.getUserEmail(clerkUserId)` and writing it in on create, and opportunistically backfilling it on read if the cached value is still `null` (covers users created before this phase shipped).

**New table:**

```sql
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  task_id uuid not null references tasks (id),
  type text not null check (type in (
    'TASK_CREATED', 'TASK_COMPLETED', 'TASK_INCOMPLETE',
    'TASK_DELETED', 'TASK_UPDATED', 'TASK_MISSED', 'DEADLINE_REMINDER'
  )),
  dedup_key text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, type, dedup_key)
);

create index notification_log_user_id_idx on notification_log (user_id);
create index notification_log_status_idx on notification_log (status);
```

`dedup_key` disambiguates within a `(task_id, type)` pair:
- One-time terminal events (`TASK_CREATED`, `TASK_COMPLETED`, `TASK_INCOMPLETE`, `TASK_DELETED`, `TASK_MISSED`) — each can only genuinely happen once per task's lifecycle (CLAUDE.md's lifecycle rules already guarantee this), so `dedup_key = 'once'`.
- `TASK_UPDATED` — a task can be edited more than once while `ACTIVE`, and each meaningful edit deserves its own email, so `dedup_key = the task's new updated_at value`, meaning retries of the *same* edit dedupe but a *later* edit is a new, distinct row.
- `DEADLINE_REMINDER` — `dedup_key = the reminder window label` (e.g. `'24h_before'`), so if more reminder windows are added later (e.g. also a 1-hour warning) each fires independently, once.

## 4. Email flow (event-driven) and reminder mechanism (scheduled)

**Event-driven path** (created/completed/incomplete/deleted/updated): `tasksService`'s existing methods call the matching `notificationService.notifyX(user, task, ...)` right after their Supabase write succeeds and before returning to the controller. `notificationService` does the insert-then-send-then-update dance described in §6 and never throws — the task operation's HTTP response is unaffected either way.

**Scheduled path** (missed + reminders), no Redis/Kafka/queue — a single `setInterval` loop in the existing long-running Node process, started once from `src/index.js` after `app.listen`:

```
runNotificationSweep():
  1. sweep = tasksRepository.sweepAllUsersMissed()      // cross-user version of the
                                                          // existing per-user sweepMissed,
                                                          // no user_id filter (service-role
                                                          // client, server-side only, never
                                                          // exposed via a route)
  2. for each task in sweep: notificationService.notifyTaskMissed(task)

  3. dueSoon = tasksRepository.findActiveDueWithinWindow(REMINDER_WINDOW)
     for each task in dueSoon without an existing DEADLINE_REMINDER/<window> log row:
       notificationService.notifyDeadlineReminder(task)

  4. retryable = notificationsRepository.findRetryable()   // status = 'FAILED', or
                                                             // status = 'PENDING' older
                                                             // than a few minutes (crash
                                                             // mid-send), capped at a max
                                                             // attempt count
     for each: re-attempt send
```

Interval defaults to every 5 minutes (`NOTIFICATION_SWEEP_INTERVAL_MINUTES`, see §7), plus one run shortly after boot. Because all state (which emails have been sent, which tasks are overdue) lives in Postgres rather than in-memory, a server restart is safe — the next tick just resumes from what the database already records; nothing is lost and nothing double-sends, since the `notification_log` unique constraint is the source of truth, not the process's memory.

**Caveat, noted not solved:** `setInterval` only works because this server runs as one long-lived Node process (`node src/index.js`, confirmed by `server/package.json`'s `start`/`dev` scripts) — it would silently stop working on a platform that runs the API as short-lived serverless functions. If the deployment target ever changes, this mechanism would need to move to an external cron hitting a protected internal endpoint instead. Not a concern for the current deployment shape, so not built now.

## 5. API changes

None required. Every notification is server-triggered as a side effect of existing endpoints (`POST /api/tasks`, `POST /api/tasks/:id/complete`, `DELETE /api/tasks/:id`, `PATCH /api/tasks/:id`, `POST /api/tasks/:id/resolve-missed`) or the internal scheduler — no new routes, no new request/response shapes on any existing endpoint. (A future phase could add user-facing notification preferences or an in-app notification feed — explicitly out of scope here, per the prompt's "no toaster/notification UI" instruction and CLAUDE.md's one-phase-at-a-time rule.)

## 6. Error handling

- `emailService.sendEmail` never throws past its own boundary — Resend API errors are caught, logged via `console.error`, and returned as a typed failure result, not an exception.
- `notificationService.notifyX` wraps its entire body in try/catch; a failure at any step (Clerk email missing, Resend error, DB error) is logged and swallowed — it never propagates back into the calling `tasksService` method, so a task operation's success/failure is never coupled to email success/failure. This is the concrete mechanism behind CLAUDE.md's "handle email failures independently" requirement.
- Dedup-and-retry pattern per attempt: insert a `PENDING` `notification_log` row first (the unique constraint on `(task_id, type, dedup_key)` is what actually prevents a duplicate send — a `23505` violation on this insert means "already claimed or sent," so the caller just returns). Only if the insert succeeds does it call Resend; on success the row flips to `SENT` with `sent_at`; on failure it flips to `FAILED` with `error_message`, left for the scheduler's retry pass (§4 step 4). A capped max-attempt count (tracked via a small counter column or by counting prior `FAILED` transitions server-side) stops a permanently-undeliverable address (e.g. no Clerk email on file) from retrying forever.
- A user with no email on file (rare edge case — Clerk allows accounts without a verified email in some configurations) results in a `FAILED` row with a clear `error_message` and is not retried past the cap.

## 7. Environment variables

New variables needed, to be added to `example.env` when this phase is actually built:

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLIENT_URL=
NOTIFICATION_SWEEP_INTERVAL_MINUTES=5
DEADLINE_REMINDER_HOURS_BEFORE=24
```

- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Resend account credentials and the verified sending address.
- `CLIENT_URL` — the deployed frontend origin (e.g. `https://chase-six-rosy.vercel.app` in prod, `http://localhost:5173` in dev), used to build "View task" links inside email bodies. Deliberately just one URL var, not a duplicate `APP_URL` + `CLIENT_URL` pair — the existing `CORS_ORIGIN` var already plays a similar role for CORS, but is a comma-separated allowlist rather than a single canonical link target, so it isn't reused for this.
- `NOTIFICATION_SWEEP_INTERVAL_MINUTES` / `DEADLINE_REMINDER_HOURS_BEFORE` — optional, sane defaults (5 and 24) if unset, so the feature works out of the box in dev without extra config.

Already-existing vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`) are reused as-is — `CLERK_SECRET_KEY` is what backs `clerkService`'s call to fetch a user's email, since it's already the credential `@clerk/express` uses server-side. No real secrets will be placed in `example.env` — only the variable names, same convention as the file today.

## 8. Testing requirements

- **Unit — `notificationTemplates.js`:** pure function tests, one per notification type, asserting subject/body content and that reason/deadline/priority values are interpolated correctly.
- **Unit — `notificationService.js`:** with `emailService` and `notificationsRepository` mocked — verifies the correct template/type is chosen per event, verifies a second call for the same `(task_id, type, dedup_key)` is a no-op (dedup), verifies a thrown/rejected `emailService` call is caught and never re-thrown.
- **Integration (extends the existing Vitest + Supertest suite):** creating/completing/deleting/editing a task still returns the correct HTTP response and status even when the mocked Resend call is forced to fail — proves task operations are never coupled to email success. Resend is mocked at the `emailService` boundary (no real emails sent in any test run), the same way `@clerk/express` is already fully mocked in `server/tests/setup.js`.
- **Scheduler:** `runNotificationSweep` tested by calling it directly (not through the real timer) against seeded overdue/upcoming tasks — confirms overdue `ACTIVE` tasks flip to `MISSED` and get exactly one `TASK_MISSED` log row even across repeated sweep calls, and that a `DEADLINE_REMINDER` fires once per window per task.

## 9. Acceptance criteria

- [ ] `users.email` migration applied; populated on create and lazily backfilled on read for pre-existing rows.
- [ ] `notification_log` table created with the unique constraint described in §3.
- [ ] All six immediate notification types (`TASK_CREATED`/`TASK_COMPLETED`/`TASK_INCOMPLETE`/`TASK_DELETED`/`TASK_UPDATED`) fire correctly from their respective `tasksService` methods, without altering those methods' existing return values or error behavior.
- [ ] `TASK_MISSED` and `DEADLINE_REMINDER` fire only from the scheduled sweep, never from the lazy per-request `ACTIVE→MISSED` check.
- [ ] No duplicate email is ever sent for the same `(task, type, dedup_key)`, verified across repeated sweep runs and a simulated server restart.
- [ ] A forced Resend failure never causes a task-management endpoint to return a non-2xx response or roll back its DB write.
- [ ] `example.env` updated with the new variables from §7, no real secrets committed.
- [ ] Full backend test suite (existing 73+ tests plus this phase's new ones) passes.
- [ ] `STATE.md` updated: Phase 17 marked `Done`, decisions log entry added for any judgment calls made during implementation (e.g. the `TASK_INCOMPLETE` inclusion, the retry-cap count actually chosen).

