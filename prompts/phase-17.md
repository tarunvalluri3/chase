# Phase 17 — Notifications & Email

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 17"). On completion, update `STATE.md` and stop. Full design detail lives in `PHASE_17.md` at the repo root — read it before implementing; this file is the scope summary.

## Goal
Add server-triggered transactional email via Resend: a confirmation on task creation, useful updates on completion/incomplete-resolution/deletion/deadline-or-priority changes, and reminder emails for upcoming and overdue deadlines — without introducing a queue/Redis/Kafka, and without coupling task-operation success to email success.

## In scope
- `emailService.js` (thin Resend wrapper), `notificationTemplates.js` (pure subject/body builders), `notificationService.js` (orchestration + dedup), `notificationsRepository.js` (Supabase calls against a new `notification_log` table) — see `PHASE_17.md` §1.
- `clerkService.js` to fetch a user's email from Clerk; a cached `users.email` column, synced on user creation and lazily backfilled on read.
- `notification_log` table (migration) with the dedup/retry design in `PHASE_17.md` §3 and §6.
- Wiring `TASK_CREATED`/`TASK_COMPLETED`/`TASK_INCOMPLETE`/`TASK_DELETED`/`TASK_UPDATED` emails into the matching `tasksService` methods, fired immediately and never able to fail the underlying request.
- A single in-process scheduled sweep (`notificationScheduler.js`, plain `setInterval`, started from `src/index.js`) that: (a) runs a new cross-user `ACTIVE→MISSED` sweep and sends `TASK_MISSED` emails from it, (b) sends `DEADLINE_REMINDER` emails for upcoming deadlines, (c) retries previously-failed sends. Restart-safe by construction, since all dedup/retry state lives in `notification_log`, not memory.
- New env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLIENT_URL`, `NOTIFICATION_SWEEP_INTERVAL_MINUTES`, `DEADLINE_REMINDER_HOURS_BEFORE` — added to `example.env` with no real secrets.
- Test coverage per `PHASE_17.md` §8: template unit tests, notification-service dedup/failure-isolation tests, integration tests proving a forced email failure never breaks a task endpoint's response, and a direct (non-timer) test of the sweep function.

## Out of scope
- Any in-app/browser notification UI, toaster, or notification feed — there is currently none in the app and this phase does not add one.
- User-facing notification preferences (opt-out, per-type toggles) — not requested, would need its own scoping.
- New client-facing REST endpoints — every notification is a side effect of an existing endpoint or the internal scheduler.
- Moving the scheduler off `setInterval` onto an external cron — only relevant if the deployment target changes to something serverless/ephemeral; not the case today.
- Phase 18 (Time Tracking) or any other future-roadmap item.

## Files/areas to create or change
- `server/src/services/emailService.js`, `notificationTemplates.js`, `notificationService.js`, `clerkService.js` (new)
- `server/src/repositories/notificationsRepository.js` (new)
- `server/src/jobs/notificationScheduler.js` (new)
- `server/src/repositories/usersRepository.js` (extend `findOrCreateByClerkUserId` to sync `email`)
- `server/src/repositories/tasksRepository.js` (add cross-user `sweepAllUsersMissed`, `findActiveDueWithinWindow`)
- `server/src/services/tasksService.js` (add notification calls at the points in `PHASE_17.md` §2 — no change to existing return values/errors)
- `server/src/index.js` (start the scheduler once after `app.listen`)
- `server/supabase/migrations/` (new migration: `users.email` + `notification_log`)
- `example.env` (new vars)
- New test files under `server/tests/` covering the above.

## Acceptance criteria
See `PHASE_17.md` §9 for the full list. Summary: migration applied and verified live; all six notification types fire correctly and exactly once each per their dedup rule; a forced Resend failure never affects a task endpoint's HTTP response or DB write; full backend test suite (existing + new) passes; `example.env` updated; `STATE.md` updated with Phase 17 marked `Done` and any judgment calls (e.g. `TASK_INCOMPLETE`'s inclusion, the retry cap chosen) logged in the decisions log.
