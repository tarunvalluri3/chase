# Phase 8 — Backend Completion & API Documentation

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 8"). On completion, update `STATE.md` and stop — do not proceed to Phase 9 without separate approval.

## Goal
Close out the backend milestone: finalize API contracts, document every endpoint (request/response/error shapes) and required env vars, do a final review pass, and confirm the backend is genuinely ready to build a frontend against.

## In scope
- Write API documentation covering every endpoint: method, path, auth requirement, request body/query/param shape, success response shape + status code, all possible error responses + status codes.
- Document environment variables required to run the backend (cross-reference `example.env`, don't duplicate values, just explain what each does and where it's used).
- Do a final consistency pass across all endpoints: confirm status codes are used consistently, confirm error shapes are identical in structure across all failure modes, confirm naming conventions are consistent (e.g. camelCase vs snake_case in JSON responses — pick one and make sure it's applied everywhere).
- Confirm the full lifecycle (create → edit → complete/miss/delete) works end-to-end manually one more time as a final sanity check before frontend work begins.
- Review `server/package.json` scripts are complete and correctly named (`dev`, `start`, `test`, `migrate`, etc.).
- Do NOT introduce new features or endpoints — this is a documentation and consistency/polish phase only.

## Out of scope
- No new backend features.
- No frontend work (Phase 9 begins that).
- No infrastructure/deployment work.

## Files/areas to create or change
- `server/API.md` (or `docs/API.md`) — the endpoint documentation described above.
- Possibly minor consistency fixes across `server/src/**` if the final review surfaces small inconsistencies (e.g. a stray inconsistent field name) — keep these narrowly scoped to consistency, not new behavior.
- `server/package.json` script cleanup if needed.

## Acceptance criteria
- [ ] Every endpoint is documented with method, path, auth requirement, request shape, success response, and all error responses with status codes.
- [ ] Environment variables are documented (referencing `example.env`).
- [ ] JSON field naming convention confirmed consistent across all endpoints.
- [ ] Status code usage confirmed consistent across all endpoints and error types.
- [ ] Final manual end-to-end lifecycle walkthrough performed and confirmed working.
- [ ] `server/package.json` scripts reviewed and complete.
- [ ] `STATE.md` updated: Phase 8 marked `Done`, next phase noted, note added confirming backend is ready for frontend integration.
