# PHASE_18.md — Push Notifications & In-App Feed

> Documentation only. Not implemented. Do not build until the user gives explicit approval ("Approved — build Phase 18"), per `CLAUDE.md`'s governing rule. Independent of Phase 17 (Email) — reuses its event triggers but not its code paths — and independent of Phase 19 (Time Tracking, renumbered from 18 to make room for this phase).

## 0. Why this phase exists

The user asked for notifications "when the app is not opened, not only using the app." Email (Phase 17) already covers that, but the request is specifically for something that reads as an OS-level notification rather than an inbox item. Two mechanisms were considered:

- **Web Push (Push API + Service Worker)** — chosen. Works even when the Chase tab/PWA is fully closed, as long as the browser/OS is running. No native app, no app-store account, no FCM/APNs — fits Chase's existing web-only stack.
- **Mobile push (FCM/APNs)** — rejected for now. Only relevant if Chase ever ships as a native/wrapped app, which it doesn't.

**Known platform constraint, load-bearing for scope:** iOS Safari only delivers Web Push to a PWA that the user has actually **installed via "Add to Home Screen"** — a normal Safari tab cannot receive push on iOS. Android Chrome supports push from an ordinary browser tab, no install required. This phase cannot change that; it's a browser/OS limitation, not a design choice. Chase already ships a `manifest.webmanifest` (Phase 16), which is the prerequisite for iOS installability, but nothing in this phase can force a user to install — the UI should ask for the OS permission the same way regardless of platform, and simply won't succeed on non-installed iOS Safari.

Paired with push, this phase also adds a lightweight **in-app notification feed** (a bell + list) — not because it satisfies "not only using the app" on its own, but because every push-worthy event should also leave a durable, visible record inside the app for whenever the user does open it (mirroring `CLAUDE.md`'s "preserve meaningful history" principle already applied to tasks). The feed is populated unconditionally at each trigger point regardless of whether push permission was ever granted.

## 1. Architecture

```
tasksService (same trigger points Phase 17 already added)
      │
      ▼
notificationService          — extended, not replaced: now fans out to three channels
      │                         (server/src/services/notificationService.js)
      ├──▶ notificationTemplates   — extended: builds { subject, html, text } (email, unchanged)
      │       AND { title, body, url } (push + in-app, new, shorter copy than email)
      │
      ├──▶ emailService            — unchanged from Phase 17
      │
      ├──▶ pushService             — NEW: thin web-push wrapper, sends one payload to one subscription
      │       (server/src/services/pushService.js)
      │
      ├──▶ notificationsFeedRepository — NEW: inserts one row per event into `notifications`
      │       (server/src/repositories/notificationsFeedRepository.js)     (the in-app feed)
      │
      └──▶ notificationsRepository  — unchanged from Phase 17 (email's own send-audit log)

pushSubscriptionsRepository   — NEW: Supabase calls only, against `push_subscriptions`
  (server/src/repositories/pushSubscriptionsRepository.js)

pushSubscriptionsController/Service — NEW: subscribe/unsubscribe endpoints (§3)

notificationsFeedController/Service — NEW: list/mark-read endpoints for the bell (§3)

client: service worker + subscribe flow + bell UI (§7)
```

`notificationService.notifyX` (the same six functions Phase 17 built) gains two more steps per call: send push to every subscription the user has, and insert one `notifications` feed row — both **after** the existing email step, both wrapped the same never-throws way. A push failure or a feed-insert failure still can never fail the underlying task operation, exactly like Phase 17's email guarantee.

## 2. Database changes

**New table — push subscriptions** (a user may have several: phone, laptop, etc., each a separate subscription):

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (endpoint)
);

create index push_subscriptions_user_id_idx on push_subscriptions (user_id);
```

`endpoint` is globally unique per the Push API spec (it's a unique URL assigned by the browser's push service), so `unique (endpoint)` doubles as "re-subscribing the same device just updates its row" (upsert on conflict) rather than accumulating duplicates. `user_agent` is stored only so a future "manage your devices" UI could label entries meaningfully — not required for this phase's own function.

**New table — in-app notification feed:**

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  task_id uuid not null references tasks (id),
  type text not null check (type in (
    'TASK_CREATED', 'TASK_COMPLETED', 'TASK_INCOMPLETE',
    'TASK_DELETED', 'TASK_UPDATED', 'TASK_MISSED', 'DEADLINE_REMINDER'
  )),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on notifications (user_id) where read_at is null;
```

Same seven `type` values as Phase 17's `notification_log`, deliberately — this is the same set of events, just a second, user-facing surface for them. `title`/`body` are stored pre-rendered (not re-derived from `type` + a join at read time) so the feed still reads correctly even if a task is later edited again or its copy-generating logic changes.

**Reused, not duplicated:** Phase 17's `notification_log` keeps doing exactly what it already does (email send-audit + dedup) — it is not widened into a generic multi-channel log. The `notifications` table above is a distinct concern (a user-facing feed, always populated, no dedup/retry semantics needed since it's a single insert per event, not a delivery attempt that can fail and need retrying).

**Push dedup/retry:** rather than a third audit table, push reuses `notification_log` by adding one column:

```sql
alter table notification_log add column channel text not null default 'EMAIL' check (channel in ('EMAIL', 'PUSH'));
alter table notification_log drop constraint notification_log_task_id_type_dedup_key_key;
alter table notification_log add constraint notification_log_task_id_type_dedup_key_channel_key
  unique (task_id, type, dedup_key, channel);
```

This keeps the exact dedup/retry mechanism Phase 17 already built (claim-then-send-then-mark against a unique constraint, §6 of `PHASE_17.md`) and just makes it channel-aware — a push send and an email send for the same event are tracked as two independent rows, each individually retryable, neither blocking the other.

## 3. API endpoints

```
POST   /api/push/subscribe          # body: { endpoint, keys: { p256dh, auth } } — upsert on endpoint
DELETE /api/push/subscribe          # body: { endpoint } — remove one device's subscription
GET    /api/notifications           # in-app feed, paginated, ?unreadOnly=true optional
POST   /api/notifications/:id/read  # mark one feed row read
POST   /api/notifications/read-all  # mark every unread row read
GET    /api/push/vapid-public-key   # returns the public key so the client doesn't need it build-time-baked
                                     # (kept as a live env-backed value, easier to rotate than a Vite env var
                                     # that requires a rebuild)
```

All five scoped to the authenticated user via the existing Clerk → internal-user-id pattern, matching every other endpoint. `read-all` and per-id `read` are separate (not a generic PATCH), per `CLAUDE.md`'s "no generic status-update endpoint, each transition is its own dedicated operation" convention already applied to tasks.

## 4. Push send flow

```
pushService.sendPush(subscription, { title, body, url }):
  1. web-push.sendNotification(subscription, JSON.stringify({ title, body, url }), vapidDetails)
  2. on success: return { ok: true }
  3. on failure:
       - if the error is a 404/410 (subscription expired or the user revoked permission at the OS level,
         both reported by the push service as a gone/not-found on send) → delete the subscription row,
         this is the only place push subscriptions are ever removed automatically
       - any other failure → return { ok: false, error }, never throws
```

`notificationService.notifyX` calls this once per subscription the user has (0, 1, or many) — a user with zero subscriptions (push never granted, or on an unsupported browser) simply gets none sent, no error, no log noise. Same claim-then-send-then-mark dance as email (§6 of `PHASE_17.md`), now keyed by `channel = 'PUSH'`.

## 5. Service worker & client subscribe flow

```
client/public/sw.js                  — NEW, hand-written (no vite-plugin-pwa; matches the project's
                                        existing preference for hand-built code over generator-owned
                                        abstractions, e.g. Tailwind v4's CSS-first config over a
                                        tailwind.config.js, no ORM, etc.)
  self.addEventListener('push', ...)     — shows the OS notification from the payload
  self.addEventListener('notificationclick', ...) — focuses/opens the app at payload.url

client/src/lib/pushClient.js         — NEW
  registerServiceWorker()             — navigator.serviceWorker.register('/sw.js')
  subscribeToPush()                   — Notification.requestPermission(), then
                                         registration.pushManager.subscribe({ userVisibleOnly: true,
                                         applicationServerKey: <fetched VAPID public key> }),
                                         then POST /api/push/subscribe
  unsubscribeFromPush()               — pushManager.getSubscription() → .unsubscribe() →
                                         DELETE /api/push/subscribe
```

**Opt-in UI, flagged as a decision to confirm at approval, not assumed:** the permission prompt needs a deliberate trigger point, not an automatic call on every app load (browsers already discourage/throttle notification prompts fired on page load with no user gesture, and it reads as hostile). Two reasonable places, either buildable:
- A dismissible one-time prompt/banner (similar in spirit to Phase 16's `OfflineBar`) shown once on `Home` after first sign-in, asking to enable notifications.
- A toggle inside `Profile` (`/profile` already exists as the account-settings destination per `DESIGN.md`'s nav table) — lower-friction to build, but only reaches a user who happens to visit Profile.
This document recommends the `Profile` toggle as the primary control (durable, always reachable, no repeated-prompt annoyance) plus a single dismissible `Home` banner the first time only (tracked via `localStorage`, not a DB field, since "have we asked before" is a device-local concern) — but the actual choice should be confirmed with the user before implementation, same posture Phase 18/19's auto-close decision took.

## 6. In-app feed UI

- A bell icon in `AppBar`'s existing, currently-unused trailing-action slot (`client/DESIGN.md` §6.2: "at most one trailing action") — shown on every authenticated screen, not just Home, since unread notifications can arrive regardless of which tab is open.
- An unread-count badge on the bell, visually consistent with `BottomNav`'s existing amber needs-review dot (`client/DESIGN.md` §6.1) rather than inventing a new badge treatment.
- Tapping it opens a sheet (reusing the existing `Sheet` primitive from Phase 12, not a new route) listing feed rows newest-first, each showing `title`/`body`/relative time (via the existing `lib/datetime.js` formatter) and linking to `/tasks/:status/:id` for its `task_id`. Tapping a row marks it read; a "Mark all read" action calls `read-all`.
- No polling — the feed refreshes on sheet-open (a plain `GET`) and, optionally, on receiving a push message via the service worker's `push` event forwarding a `postMessage` to any open tab (a nice-to-have, not required for correctness, since opening the sheet already re-fetches).

## 7. Environment variables

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:
```

Generated once via `web-push generate-vapid-keys` (a one-time setup step, documented in the phase's own README note, not committed as real values — same "names only" convention `example.env` already follows). `VAPID_SUBJECT` is a contact `mailto:`/URL the push services use to reach the sender if something's wrong, required by the Web Push protocol. No client-side env var is needed for the public key — the client fetches it live from `GET /api/push/vapid-public-key` (§3), so rotating keys never requires a frontend rebuild.

Already-existing vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `RESEND_API_KEY`, etc. from Phases 2/17) are reused as-is.

## 8. Error handling

Same posture as Phase 17 throughout — nothing in this phase can turn into a failed task-management response:
- `pushService.sendPush` never throws past its own boundary, same as `emailService.sendEmail`.
- `notificationsFeedRepository`'s insert is wrapped the same never-throws way inside `notificationService.notifyX` — a feed-insert failure is logged and swallowed, not propagated.
- An expired/revoked subscription is pruned automatically on a 404/410 send response (§4) rather than retried forever or left to accumulate as dead weight.
- `POST /api/push/subscribe` and the feed endpoints follow the existing Zod-validation + ownership-scoping + consistent-error-shape rules from `CLAUDE.md`'s Security section, same as every other endpoint.

## 9. Testing requirements

- **Unit — `pushService.js`:** mocked `web-push`, verifies success/failure/expired-subscription-prunes-row paths, never throws.
- **Unit — `notificationTemplates.js`:** extended tests for the new `{ title, body, url }` shape per type, alongside the existing email-shape tests.
- **Unit — `notificationService.js`:** extended to verify a `notifyX` call with zero/one/many subscriptions sends the correct number of push calls, still inserts exactly one feed row regardless of push outcome, and dedupes per `(task_id, type, dedup_key, channel)`.
- **Integration:** `POST /api/push/subscribe` (create + upsert-on-conflict), `DELETE /api/push/subscribe`, `GET /api/notifications` (ownership-scoped, correct pagination/unread filter), `POST /api/notifications/:id/read` and `/read-all` (ownership-scoped, idempotent). Task-management endpoints (`POST /api/tasks`, complete, delete, etc.) still return correct 2xx responses even when `pushService`/feed-insert are forced to fail, mirroring Phase 17's email-failure-isolation tests.
- **Frontend (extends the Phase 16 Vitest + Testing Library setup):** bell badge shows correct unread count, sheet lists feed rows, marking read clears the badge, `pushClient.js`'s permission/subscribe flow tested with `Notification`/`serviceWorker`/`pushManager` mocked (no real browser push in CI).

## 10. Acceptance criteria

- [ ] `push_subscriptions` and `notifications` tables created; `notification_log` extended with `channel` and the widened unique constraint.
- [ ] `web-push` VAPID keys generated and documented (names only in `example.env`, no real values committed).
- [ ] All five new endpoints implemented, ownership-scoped, correctly validated.
- [ ] Every existing Phase 17 trigger point (`TASK_CREATED`/`TASK_COMPLETED`/`TASK_INCOMPLETE`/`TASK_DELETED`/`TASK_UPDATED` immediate, `TASK_MISSED`/`DEADLINE_REMINDER` via the scheduler) now also sends push (when subscriptions exist) and always inserts a feed row, without altering Phase 17's existing email behavior or `tasksService`'s return values.
- [ ] A forced push-send failure or feed-insert failure never causes a task-management endpoint to return a non-2xx response.
- [ ] An expired/revoked subscription is pruned automatically rather than retried indefinitely.
- [ ] Service worker registers, permission-prompt placement decision (§5) confirmed with the user before implementation.
- [ ] Bell + badge + sheet implemented per §6, reusing the existing `Sheet` primitive.
- [ ] Full backend + frontend test suites (existing + new) pass.
- [ ] `STATE.md` updated: Phase 18 marked `Done`, with the opt-in-placement decision's actual resolution logged in the decisions log.
