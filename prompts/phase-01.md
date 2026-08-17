# Phase 1 — Authentication

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 1"). On completion, update `STATE.md` and stop — do not proceed to Phase 2 without separate approval.

## Goal
Integrate Clerk for authentication on the backend. Every route that needs a user identity should be protected by auth middleware, and downstream code (controllers/services) should be able to reliably get the authenticated user's Clerk identity from the request.

## In scope
- Install and configure the Clerk backend SDK for Express.
- Read `CLERK_SECRET_KEY` (and `CLERK_PUBLISHABLE_KEY` if needed) from env — already documented in `example.env`.
- Create auth middleware that verifies the request's Clerk session/token and attaches the authenticated identity (at minimum the Clerk user id) to the request object for downstream use.
- Apply this middleware to a small protected test route (or extend `/api/health` into an authenticated variant, e.g. `/api/me`) to prove auth works end-to-end.
- Define clear, consistent unauthenticated-request behavior: return `401` with a generic JSON error shape when no valid session is present.
- Document (in code comments or a short section here, not extra files) how the internal `users` table row will eventually map from `clerk_user_id` — but do NOT create the database or `users` table yet; that's Phase 2. If a protected route needs to prove "who is this," it's fine for now to just return the Clerk user id from the verified session — no DB lookup yet.

## Out of scope
- No `users` table, no Postgres, no `pg` (Phase 2).
- No task routes/logic (Phase 3).
- No frontend Clerk integration (Phase 10).
- No authorization/ownership logic beyond "is this request authenticated at all" (deeper ownership checks are Phase 5, once tasks and users exist).

## Files/areas to create or change
- `server/src/middleware/auth.js` (Clerk verification middleware).
- A protected test route, e.g. `server/src/routes/me.js` mounted at `/api/me`, returning the authenticated Clerk user id.
- Update `server/src/app.js` (or equivalent) to wire the new route.
- Update `package.json` deps for the Clerk backend SDK.

## Acceptance criteria
- [ ] Clerk backend SDK installed and configured from env vars.
- [ ] Auth middleware correctly rejects requests without a valid session (`401`, generic JSON error).
- [ ] Auth middleware correctly allows requests with a valid Clerk session through, attaching the Clerk user id to `req`.
- [ ] A protected route (e.g. `/api/me`) demonstrates the flow end-to-end.
- [ ] No raw Clerk/SDK error internals leak to the client on failure.
- [ ] No database code introduced in this phase.
- [ ] `STATE.md` updated: Phase 1 marked `Done`, next phase noted, any decisions (e.g. which Clerk verification method/session strategy used) logged.
