# Phase 18 — Push Notifications & In-App Feed

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 18"). On completion, update `STATE.md` and stop. Full design detail lives in `PHASE_18.md` at the repo root — read it before implementing; this file is the scope summary.

## Goal
Notify the user of task events even when Chase isn't open, via Web Push (Push API + service worker) — the mechanism that actually works while the app is closed, unlike email's inbox-only delivery. Pair it with a lightweight in-app notification feed (bell + list) so every event also leaves a durable, visible record for whenever the user next opens the app. No native app, no FCM/APNs.

## In scope
- `push_subscriptions` table (one row per subscribed device) and `notifications` table (the in-app feed) — migrations, per `PHASE_18.md` §2.
- `notification_log` extended with a `channel` column so Phase 17's existing dedup/retry mechanism covers push sends independently from email sends.
- `pushService.js` (thin `web-push` wrapper, prunes expired/revoked subscriptions automatically on a 404/410 send response), `pushSubscriptionsRepository.js`, `pushSubscriptionsController/Service.js` — see `PHASE_18.md` §1/§4.
- `notificationsFeedRepository.js` + controller/service for the in-app feed (list/mark-read/mark-all-read) — `PHASE_18.md` §3/§6.
- `notificationTemplates.js` extended to also build a short `{ title, body, url }` shape for push/in-app, alongside Phase 17's existing email shape.
- `notificationService.notifyX` (the same six functions Phase 17 built) extended to fan out to push + the in-app feed, in addition to email — never able to fail the underlying task operation, same guarantee as Phase 17.
- New endpoints: `POST /api/push/subscribe`, `DELETE /api/push/subscribe`, `GET /api/push/vapid-public-key`, `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`.
- Client: hand-written `client/public/sw.js` service worker, `lib/pushClient.js` (permission request + subscribe/unsubscribe), a bell icon in `AppBar`'s currently-unused trailing-action slot with an unread badge, and a `Sheet`-based feed list (reusing Phase 12's `Sheet` primitive).
- New env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — added to `example.env`, no real secrets.
- Test coverage per `PHASE_18.md` §9: push-service unit tests, extended template/notificationService tests, endpoint integration tests, task-endpoint failure-isolation tests, frontend bell/feed/subscribe-flow tests.

## Decision to confirm before/at implementation (flagged in `PHASE_18.md` §5, not to be assumed silently)
Where the "enable notifications" opt-in lives: a `Profile` toggle (durable, always reachable) plus a one-time dismissible `Home` banner, or some other placement. The doc recommends the Profile-toggle-plus-one-time-banner combination, but this should be explicitly confirmed with the user, the same way Phase 19's auto-close decision and Phase 17's `TASK_INCOMPLETE` inclusion were confirmed rather than assumed.

## Out of scope
- Mobile push via FCM/APNs — no native app exists or is planned.
- Per-type notification preferences (e.g. "email me but don't push me for X") — not requested; the toggle in scope is a single on/off for push as a whole, not granular routing.
- A "manage your devices" UI listing individual push subscriptions — `push_subscriptions.user_agent` is stored for a future version of this, not surfaced anywhere in this phase.
- Any change to Phase 17's email behavior, templates, or send guarantees — email keeps working exactly as it does today; this phase only adds two more channels alongside it.
- Phase 19 (Time Tracking) or any other future-roadmap item.

## Files/areas to create or change
- `server/src/services/pushService.js`, `notificationsFeedRepository`-related service/controller (new)
- `server/src/repositories/pushSubscriptionsRepository.js`, `notificationsFeedRepository.js` (new)
- `server/src/controllers/pushSubscriptionsController.js`, `notificationsController.js` (new)
- `server/src/routes/push.js`, `notifications.js` (new, mounted in `app.js`)
- `server/src/services/notificationService.js` (extend `notifyX` to fan out to push + feed)
- `server/src/services/notificationTemplates.js` (extend `buildEmail`-style function to also build the push/feed shape)
- `server/supabase/migrations/` (new migration: `push_subscriptions`, `notifications`, `notification_log.channel`)
- `example.env` (new VAPID vars)
- `client/public/sw.js` (new)
- `client/src/lib/pushClient.js` (new)
- `client/src/components/nav/AppBar.jsx` (add the bell trailing action)
- `client/src/components/notifications/` — new bell badge + feed sheet components
- `client/src/routes/Profile.jsx` (add the notifications toggle, pending the §5 decision)
- New test files under `server/tests/` and `client/src/` covering the above.

## Acceptance criteria
See `PHASE_18.md` §10 for the full list. Summary: both new tables + the `notification_log.channel` migration applied and verified live; all five new endpoints implemented and ownership-scoped; every existing Phase 17 trigger point now also sends push and always writes a feed row, without changing Phase 17's email behavior; a forced push or feed-insert failure never breaks a task-management response; expired subscriptions self-prune; the opt-in placement decision is confirmed and implemented; bell/badge/feed sheet built and working; full backend + frontend test suites pass; `STATE.md` updated with Phase 18 marked `Done`.
