# Phase 0 — Project Foundation

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 0"). On completion, update `STATE.md` and stop — do not proceed to Phase 1 without separate approval.

## Goal
Stand up the bare project skeleton: `client/` and `server/` folders exist correctly, the Express backend is initialized with basic structure, env config is wired, and a health-check endpoint proves the server runs. No business logic, no database, no auth yet.

## In scope
- Confirm/create `client/` (kept empty except `.gitkeep` — no frontend code yet) and `server/` folders.
- Initialize a Node project inside `server/` (`package.json`, `type: module` or CommonJS — pick one and note it in `STATE.md` decisions log).
- Install minimal deps needed for a running Express server: `express`, `dotenv`, `cors`, and dev tooling (e.g. `nodemon`) as appropriate. Do NOT install `pg`, `zod`, or Clerk SDKs yet — those belong to later phases.
- Basic server entrypoint (e.g. `server/src/index.js` or similar) that starts Express and listens on `PORT` from env.
- Basic env loading (`dotenv`), reading from `server/.env` (not committed — `.gitignore` already covers this). Reference `example.env` at the project root for the variable names relevant to this phase (`NODE_ENV`, `PORT`).
- Minimal middleware foundation: JSON body parsing, CORS, a placeholder for future auth/validation/error middleware (structure only, not implementation).
- Minimal centralized error-handling foundation: a basic Express error-handling middleware that catches unhandled errors and returns a generic JSON error shape (no leaking stack traces). This will be expanded in Phase 4.
- A `GET /api/health` endpoint returning a simple JSON payload (e.g. `{ "status": "ok" }`) to prove the server runs.
- Basic `server/README.md` or inline comments only if truly necessary — prefer no extra docs beyond what's asked.
- Confirm layered folder structure exists as empty/near-empty scaffolding matching `Client → Route → Middleware → Controller → Service → Repository → Postgres/Supabase` (e.g. `server/src/routes`, `server/src/middleware`, `server/src/controllers`, `server/src/services`, `server/src/repositories`), even though most will be empty until later phases.

## Out of scope
- No database connection or schema (Phase 2).
- No Clerk/auth integration (Phase 1).
- No Zod validation (Phase 4).
- No task routes/controllers/services/repositories with real logic (Phase 3).
- No frontend code beyond the empty `client/` folder with `.gitkeep` (Phase 9+).
- No tests yet (Phase 7).

## Files/areas to create or change
- `server/package.json`, `server/.env` is user-provided (not created by Claude — only `example.env` at root documents the shape), `server/src/index.js` (or equivalent entrypoint), `server/src/app.js` (Express app setup) if splitting app/server, `server/src/routes/health.js` or similar, `server/src/middleware/errorHandler.js` (basic version), empty-but-present `server/src/controllers/`, `server/src/services/`, `server/src/repositories/` directories (can hold a `.gitkeep` if empty).

## Acceptance criteria
- [ ] `server/` has a valid `package.json` and installs cleanly with `npm install`.
- [ ] Running the server (e.g. `npm run dev` or `npm start`) starts Express without errors, provided a valid `server/.env` is present.
- [ ] `GET /api/health` returns HTTP 200 with a JSON body.
- [ ] Server reads `PORT` from env; falls back sensibly if unset (document the fallback).
- [ ] A basic Express error-handling middleware is wired in and returns a generic JSON error shape (not raw stack traces) for unhandled errors.
- [ ] Folder structure reflects the layered architecture from `CLAUDE.md`, even where mostly empty.
- [ ] No database, auth, or Zod dependencies installed.
- [ ] `client/` remains empty except `.gitkeep`.
- [ ] `STATE.md` updated: Phase 0 marked `Done`, current phase moved to reflect Phase 1 as next, any decisions (e.g. ESM vs CommonJS, exact entrypoint layout) logged in the Decisions log.
