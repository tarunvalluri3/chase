# Phase 4 — Validation & Error Handling

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 4"). On completion, update `STATE.md` and stop — do not proceed to Phase 5 without separate approval.

## Goal
Formalize input validation with Zod across all task endpoints, and centralize error handling so the API returns consistent, safe JSON error shapes with correct HTTP status codes for every failure mode.

## In scope
- Install Zod (if not already installed).
- Define Zod schemas for:
  - Task creation body (`title` required, `description` optional, `deadline` required and valid, `priority` required enum).
  - Task edit (PATCH) body — only the editable fields, all optional but at least one required, correct types.
  - Miss body (`reason` required, non-empty, trimmed).
  - Delete body (`reason` required, non-empty, trimmed).
  - Query param validation for `GET /api/tasks?status=` — must be one of the valid enum values or absent.
  - Route param validation for `:id` (valid id format, e.g. UUID or integer depending on Phase 2's schema choice).
- Create validation middleware that runs Zod schemas against `req.body`/`req.query`/`req.params` and returns `400` with a consistent, clear JSON error shape (e.g. `{ "error": { "message": "...", "details": [...] } }`) on failure — without leaking internal Zod/stack details beyond field-level messages.
- Expand the centralized error-handling middleware from Phase 0 to:
  - Distinguish validation errors (400), not-found (404), invalid state transitions (409 or 400 — pick one and be consistent), auth errors (401/403), and unexpected server errors (500).
  - Never leak raw SQL, Postgres error messages, or stack traces to the client, even on unexpected errors.
  - Log the real error server-side (console is fine at this stage) while returning a generic message to the client for 500s.
- Update controllers/services from Phase 3 to use the validation middleware and to throw/return typed errors that the centralized handler can interpret consistently.

## Out of scope
- No new business logic or endpoints — this phase only tightens validation and error handling on what Phase 3 built.
- No authorization/ownership hardening beyond what already exists (Phase 5).
- No tests yet (Phase 7), though manual verification of error responses is expected.

## Files/areas to create or change
- `server/src/validation/taskSchemas.js` (Zod schemas).
- `server/src/middleware/validate.js` (generic Zod-validation middleware, reusable across routes).
- `server/src/middleware/errorHandler.js` (expanded from Phase 0).
- Possibly a small `server/src/errors/AppError.js`-style typed error class hierarchy (e.g. `NotFoundError`, `ValidationError`, `InvalidTransitionError`) used by services and interpreted by the error handler — keep this minimal, not an elaborate framework.
- Update `server/src/routes/tasks.js` to apply validation middleware per endpoint.

## Acceptance criteria
- [ ] Every task endpoint validates its body/query/params with Zod before reaching the controller logic.
- [ ] Invalid input returns `400` with a consistent, safe JSON error shape and useful (but not leaky) field-level messages.
- [ ] Empty or whitespace-only `reason` on miss/delete is rejected with `400`.
- [ ] Invalid `status` filter value on `GET /api/tasks` is rejected with `400`.
- [ ] Invalid state transitions (e.g. re-completing a completed task) return a clear, consistent client error status — not a 500.
- [ ] Not-found / not-owned tasks return a consistent status (matching the choice made in Phase 3).
- [ ] Unexpected errors (e.g. a DB outage) return a generic `500` JSON body with no internal details, while the real error is logged server-side.
- [ ] No behavior regressions on the endpoints built in Phase 3.
- [ ] `STATE.md` updated: Phase 4 marked `Done`, next phase noted, decisions logged (exact error shape, status code choices for edge cases).
