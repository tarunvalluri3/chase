# Phase 7 — Backend Testing

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 7"). On completion, update `STATE.md` and stop — do not proceed to Phase 8 without separate approval.

## Goal
Build an automated backend test suite with Vitest + Supertest covering auth, authorization/ownership, CRUD, lifecycle transitions, validation, and filtering — turning Phase 5's manual security audit and Phase 3/4/6's manual verification into repeatable, automated tests.

## In scope
- Install Vitest and Supertest (and any needed test-only deps, e.g. a way to mock/stub Clerk auth for tests without hitting real Clerk infrastructure).
- Set up a test database strategy (e.g. a separate test schema/database, or transactional rollback per test) so tests don't pollute real data — document the chosen approach in `STATE.md`'s Decisions log.
- Write tests covering:
  - **Auth:** unauthenticated requests are rejected (401) on all task routes.
  - **Authorization / cross-user:** a second test user cannot read/edit/complete/miss/delete a first user's task; responses don't leak existence.
  - **Creation:** valid task creation succeeds; invalid payloads are rejected with 400.
  - **Listing & filtering:** `GET /api/tasks` returns only the requesting user's tasks; `?status=` filtering works for each status value.
  - **Get one:** valid id returns the task; foreign/nonexistent id returns the consistent not-found response.
  - **Editing:** PATCH updates allowed fields on ACTIVE tasks; rejects edits to COMPLETED/MISSED/DELETED tasks; rejects attempts to set system-controlled fields.
  - **Completion:** ACTIVE → COMPLETED works and sets correct fields; re-completing fails; completing a MISSED/DELETED task fails.
  - **Missed (manual):** requires non-empty reason; ACTIVE → MISSED works and sets correct fields; invalid transitions rejected.
  - **Missed (automatic, from Phase 6):** an ACTIVE task past its deadline is transitioned to MISSED on read; COMPLETED tasks past deadline are untouched.
  - **Deletion:** requires non-empty reason; soft-delete confirmed (row still exists in DB, `status=DELETED`); invalid transitions rejected.
  - **Validation edge cases:** empty/whitespace reasons, invalid enum values, missing required fields, malformed ids.
- Wire a test script into `server/package.json` (e.g. `npm test`).

## Out of scope
- No frontend tests (Phase 16).
- No new backend features or endpoints — this phase only adds test coverage for what already exists (Phases 0–6).
- No CI/CD pipeline setup unless the user explicitly asks — focus on the test suite itself running locally first.

## Files/areas to create or change
- `server/tests/` (or `server/src/__tests__/`) — organized by concern, e.g. `auth.test.js`, `authorization.test.js`, `tasks.crud.test.js`, `tasks.lifecycle.test.js`, `tasks.validation.test.js`, `tasks.filtering.test.js`.
- `server/vitest.config.js` (or equivalent) if needed.
- Test helpers/fixtures for creating test users and authenticated request contexts (e.g. a helper to mock Clerk auth for test requests).
- Update `server/package.json` with `test` script and new devDependencies.

## Acceptance criteria
- [ ] `npm test` runs the full suite and passes against a clean test database.
- [ ] All coverage areas listed above (auth, cross-user, CRUD, completion, missed manual + automatic, deletion, validation, filtering) have corresponding passing tests.
- [ ] Tests don't depend on real Clerk network calls (auth is mocked/stubbed appropriately for test speed and reliability).
- [ ] Tests clean up after themselves / don't leak state between runs.
- [ ] `STATE.md` updated: Phase 7 marked `Done`, next phase noted, test-database strategy and auth-mocking approach logged as decisions.
