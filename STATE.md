# STATE.md — Chase Progress Tracker

## How to resume (read this first)

At the start of any session, Claude Code reads `CLAUDE.md` then `STATE.md` before doing anything else. Work only proceeds on a phase that has been explicitly **approved** by the user in this session or a prior one — never on a phase whose status below is merely "Prompt ready." If unsure which phase is current, ask.

---

## Current Phase

**Phase:** 2 — Database. Done.
**Overall status:** Supabase schema (`users`, `tasks`) created via SQL run in the Supabase SQL Editor; `@supabase/supabase-js` client wired up from `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; connectivity smoke-tested successfully (`npm run db:smoke-test` in `server/`). Awaiting approval to begin Phase 3 (Core Task REST API).

---

## Phase Status Table

| Phase | Name | Status |
|-------|------|--------|
| 0 | Project Foundation | Done |
| 1 | Authentication | Done |
| 2 | Database | Done |
| 3 | Core Task REST API | Prompt ready |
| 4 | Validation & Error Handling | Prompt ready |
| 5 | Authorization & Security | Prompt ready |
| 6 | Automatic Task Status Handling | Prompt ready |
| 7 | Backend Testing | Prompt ready |
| 8 | Backend Completion & API Documentation | Prompt ready |
| 9 | Frontend Foundation | Prompt ready |
| 10 | Authentication Frontend | Prompt ready |
| 11 | Application Shell | Prompt ready |
| 12 | Task Management UI | Prompt ready |
| 13 | Task Lifecycle UI | Prompt ready |
| 14 | Dashboard | Prompt ready |
| 15 | Analytics | Prompt ready |
| 16 | Frontend Testing & Polish | Prompt ready |

Status values: `Not started` → `Prompt ready` → `Approved` → `In progress` → `Done`.

---

## Decisions Log

- **2026-08-17, Phase 0:** Server uses ESM (`"type": "module"` in `server/package.json`), not CommonJS.
- **2026-08-17, Phase 0:** Entrypoint split into `server/src/index.js` (env load + `app.listen`) and `server/src/app.js` (Express app/middleware/route wiring), for testability in later phases.
- **2026-08-17, Phase 0:** `PORT` falls back to `8080` if unset in env.
- **2026-08-17, Phase 1:** Used `@clerk/express` (`clerkMiddleware()` + `getAuth()`), not the deprecated `requireAuth()` helper — `requireAuth()` redirects to a sign-in URL on failure rather than returning JSON, which doesn't fit an API-only backend. Auth is enforced via a small custom `requireAuthenticated` middleware (`server/src/middleware/auth.js`) that checks `getAuth(req).userId` and returns a generic `401` JSON error if absent.
- **2026-08-17, Phase 1:** `withClerkAuth` (`clerkMiddleware()`) is applied globally in `app.js` (before route mounting) so `getAuth(req)` is available anywhere; `requireAuthenticated` is applied per-route (currently only `/api/me`) so unauthenticated routes like `/api/health` stay open.
- **2026-08-17, Phase 1:** No `users` table lookup yet — `/api/me` returns the raw Clerk user id straight from the verified session, per Phase 1 scope. Mapping to internal `users.id` via `users.clerk_user_id` happens starting Phase 2.
- **2026-08-17, Phase 2:** `status` and `priority` enforced via Postgres `CHECK` constraints (not enum types) — simpler to alter later (`ALTER TABLE ... DROP/ADD CONSTRAINT`) than `ALTER TYPE`, and the value sets are still fully controlled by `CLAUDE.md`.
- **2026-08-17, Phase 2:** Migration applied by hand through the Supabase SQL Editor, not `supabase db push` — the Supabase CLI's `db push` requires an interactive `supabase login` + `supabase link` (project access token / DB password), which isn't available non-interactively in this session. Migration SQL still lives in the repo at `server/supabase/migrations/` for review, per the Supabase CLI's own file convention.
- **2026-08-17, Phase 2:** `supabase/migrations/` lives under `server/supabase/migrations/`, not at the repo root, per user preference (keeps all backend-owned artifacts under `server/`).
- **2026-08-17, Phase 2:** Connectivity smoke test lives at `server/src/db/smokeTest.js` (run via `npm run db:smoke-test` in `server/`) rather than a temporary route — a one-off script that queries `users` through `@supabase/supabase-js`. It's a real script kept in the repo, not something to strip before merge.

---

## Next Step

Review `prompts/phase-03.md`. When ready, reply with approval (e.g. "Approved — build Phase 3") to begin.
