# Phase 5 — Authorization & Security

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 5"). On completion, update `STATE.md` and stop — do not proceed to Phase 6 without separate approval.

## Goal
Harden authorization and security across the whole API surface: guarantee that ownership is derived solely from the authenticated identity, that cross-user access is impossible, and that system-controlled fields can never be set by a client. Conduct a focused security review of everything built so far.

## In scope
- Audit every repository query touching `tasks` and confirm each one is scoped by the authenticated user's internal `users.id` — no query should be able to return or mutate another user's row, even if a malicious `:id` is supplied.
- Add/verify explicit cross-user access tests via manual verification (automated tests are Phase 7, but this phase should manually confirm behavior): user A must not be able to read, edit, complete, miss, or delete user B's task, and must receive the same not-found-style response as for a genuinely nonexistent id (avoid leaking existence of other users' tasks via response differences).
- Confirm system-controlled fields (`user_id`, `status`, `completed_at`, `missed_at`, `deleted_at`, `missed_reason`, `deletion_reason`, `created_at`, `updated_at`) can never be set/overridden by client input on any endpoint, including PATCH — re-verify Zod schemas from Phase 4 strip/reject these.
- Confirm the auth middleware from Phase 1 is applied to every task route with no gaps.
- Review error responses for information leakage (e.g. distinguishing "task doesn't exist" from "task belongs to someone else" in a way that leaks data).
- Review CORS configuration for correctness (not overly permissive for a real deployment, but reasonable for local dev).
- Review that all SQL remains parameterized (re-audit repositories).
- Document findings and fixes made during this review directly in `STATE.md`'s Decisions log — this phase is partly an audit, so its "output" includes a short written record of what was checked and what (if anything) was fixed.

## Out of scope
- No new endpoints or business features.
- No automated test suite (Phase 7) — though this phase's manual verification should closely resemble what Phase 7 will later automate.
- No frontend work.

## Files/areas to create or change
- Likely edits to `server/src/repositories/tasksRepository.js`, `server/src/services/tasksService.js`, `server/src/validation/taskSchemas.js`, `server/src/middleware/auth.js`, and `server/src/app.js` (CORS config) — exact files depend on what the audit finds. No new files expected unless a gap requires one (e.g. a missing ownership check helper).

## Acceptance criteria
- [ ] Every task query/mutation is provably scoped to the authenticated user's internal id.
- [ ] Attempting to access/modify another user's task behaves identically (from the client's perspective) to accessing a nonexistent task — no leakage of existence/ownership.
- [ ] All system-controlled fields are confirmed unsettable by client input across every endpoint, including PATCH.
- [ ] Every task route requires authentication with no gaps.
- [ ] CORS configuration reviewed and reasonable for the current stage.
- [ ] All SQL confirmed parameterized.
- [ ] A short written summary of what was audited and what (if anything) was fixed is added to `STATE.md`'s Decisions log.
- [ ] `STATE.md` updated: Phase 5 marked `Done`, next phase noted.
