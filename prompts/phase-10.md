# Phase 10 — Authentication Frontend

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 10"). On completion, update `STATE.md` and stop — do not proceed to Phase 11 without separate approval.

## Goal
Build the frontend authentication experience: login, signup, logout, protected app routes, and session handling, using Clerk's React components/hooks on top of the provider wired in Phase 9.

## In scope
- Build login and signup screens using Clerk's prebuilt React components (`<SignIn />`, `<SignUp />`) or Clerk's hooks with custom UI — prefer Clerk's prebuilt components unless the user asks for custom UI, to minimize surface area.
- Implement logout (Clerk's `useClerk().signOut()` or equivalent) accessible from somewhere reasonable (a placeholder location is fine — real navigation placement comes in Phase 11).
- Implement protected route logic: routes that require authentication redirect unauthenticated users to login; authenticated users are allowed through.
- Implement session handling: ensure the API client from Phase 9 correctly attaches the current Clerk session token to backend requests, and that a logged-out state correctly stops sending stale/invalid tokens.
- Handle basic loading states while Clerk determines auth status (avoid flash-of-wrong-content).
- Mobile-first styling for all auth screens per `CLAUDE.md`.

## Out of scope
- No app shell/navigation/layout (Phase 11).
- No task-related UI (Phase 12+).
- No custom backend auth logic changes (already done in Phase 1) — this phase is frontend-only.

## Files/areas to create or change
- `client/src/routes/auth/Login.jsx` (or similar), `client/src/routes/auth/Signup.jsx`.
- `client/src/components/auth/ProtectedRoute.jsx` (or router-level equivalent, e.g. a layout route with an auth guard).
- Update `client/src/routes/` (router config) to distinguish public vs protected routes.
- Update `client/src/lib/apiClient.js` if needed to correctly attach/omit the session token based on auth state.

## Acceptance criteria
- [ ] Users can sign up and log in via Clerk-backed UI.
- [ ] Users can log out and are correctly returned to an unauthenticated state.
- [ ] Protected routes redirect unauthenticated users to login; authenticated users can access them.
- [ ] The API client correctly attaches a valid session token to authenticated requests and a test authenticated call to the backend (e.g. `/api/me` from Phase 1) succeeds.
- [ ] No flash of protected content before auth state resolves.
- [ ] Auth screens are usable and correctly laid out on a mobile viewport.
- [ ] `STATE.md` updated: Phase 10 marked `Done`, next phase noted, decisions logged (prebuilt vs custom Clerk UI choice).
