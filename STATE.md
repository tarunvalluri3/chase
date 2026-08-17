# STATE.md — Chase Progress Tracker

## How to resume (read this first)

At the start of any session, Claude Code reads `CLAUDE.md` then `STATE.md` before doing anything else. Work only proceeds on a phase that has been explicitly **approved** by the user in this session or a prior one — never on a phase whose status below is merely "Prompt ready." If unsure which phase is current, ask.

---

## Current Phase

**Phase:** 0 — Project Foundation. Done.
**Overall status:** Server skeleton stood up and verified (`GET /api/health` returns 200). Awaiting approval to begin Phase 1 (Authentication).

---

## Phase Status Table

| Phase | Name | Status |
|-------|------|--------|
| 0 | Project Foundation | Done |
| 1 | Authentication | Prompt ready |
| 2 | Database | Prompt ready |
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

---

## Next Step

Review `prompts/phase-01.md`. When ready, reply with approval (e.g. "Approved — build Phase 1") to begin.
