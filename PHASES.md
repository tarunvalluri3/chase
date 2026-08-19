# PHASES.md — Chase Roadmap

Chase is built strictly one phase at a time, with explicit approval required before any phase is implemented. See `CLAUDE.md` for the governing workflow rule and `STATE.md` for current progress.

---

## Phases 0–18 (in scope, prompts drafted in `prompts/`)

**Phase 0 — Project Foundation**
Create `client/` & `server/`, `.gitkeep` in `client/`, init Node/Express backend, install deps, env config, basic server structure, middleware foundation, error-handling foundation, health-check endpoint.

**Phase 1 — Authentication**
Clerk integration, auth middleware, protected routes, authenticated user context, user identity handling.

**Phase 2 — Database**
Supabase setup via `@supabase/supabase-js` (no ORM, no `pg`), schema/migrations through Supabase's own migration flow, `users` table, `tasks` table, relationships/constraints/indexes. Note: the `tasks.status` enum/CHECK and reason/timestamp columns are extended later, in Phase 6, to add `INCOMPLETE` plus `incomplete_reason`/`incomplete_at` — see `prompts/phase-06.md`.

**Phase 3 — Core Task REST API**
Create / list / get-one / edit, complete, soft delete (require reason), status filtering, lifecycle enforcement for `ACTIVE→COMPLETED`/`ACTIVE→DELETED`. No manual "miss" endpoint — `MISSED` is exclusively automatic and is introduced in Phase 6.

**Phase 4 — Validation & Error Handling**
Zod schemas, body + query/param validation, consistent API responses, centralized error handling, invalid-transition handling, DB error handling.

**Phase 5 — Authorization & Security**
Ownership, prevent cross-user access, secure all task queries, protect system-controlled fields, auth/authz hardening, security review.

**Phase 6 — Automatic Task Status Handling**
Deadline-based automatic `ACTIVE→MISSED` transition (MISSED means "deadline passed without a completion confirmation," not "never completed" — it's a pending checkpoint, not a verdict). Adds a `status=INCOMPLETE` value plus `incomplete_reason`/`incomplete_at` columns via a schema migration, and the `POST /api/tasks/:id/resolve-missed` flow letting the user resolve a MISSED task as `INCOMPLETE` (requires a reason; terminal) or `COMPLETED` (becomes COMPLETED, `completed_at` set, missed history preserved). Correct timestamps, prevent bad transitions, kept ready for future scheduled processing (mechanism documented in `prompts/phase-06.md`).

**Phase 7 — Backend Testing**
Auth, authorization/cross-user, CRUD, completion, missed + reason, deletion + reason, validation, state-transition tests.

**Phase 8 — Backend Completion & API Documentation**
Final API contracts, endpoint/request/response/error/env docs, final backend review, confirm backend is ready for frontend.

**Phase 9 — Frontend Foundation**
React/Vite setup, deps, routing, API client, auth integration, global app structure, basic UI system.

**Phase 10 — Authentication Frontend**
Login, signup, logout, protected app routes, session handling.

**Phase 11 — Application Shell**
Main layout, navigation, sidebar/header, responsive structure, Home/Active/Completed/Missed/Incomplete/Deleted sections.

**Phase 12 — Task Management UI**
Create task, task list per section including a separate Incomplete section, cards/items, task details, edit, deadline & priority display, loading/empty/error states.

**Phase 13 — Task Lifecycle UI**
Complete, delete (collect reason), resolve a MISSED task as INCOMPLETE (collect reason) or COMPLETED (no reason needed), correct status display, confirmation flows. No manual "mark as missed" UI — MISSED only ever arises automatically.

**Phase 14 — Dashboard**
Overview, task counts, active/completed/missed/incomplete/deleted summaries, recent activity.

**Phase 15 — Analytics**
Completion/missed/incomplete/deleted analysis, reason analysis (including why tasks were confirmed incomplete vs. auto-detected missed), trends, charts/visualizations, historical analysis.

**Phase 16 — Frontend Testing & Polish**
Component tests, API integration tests, auth-flow tests, task-workflow tests, responsive behavior, UX refinement, performance/accessibility review.

**Phase 17 — Notifications & Email**
Transactional email via Resend: creation confirmation, updates on completion/incomplete-resolution/deletion/deadline-priority changes, and reminder emails for upcoming/overdue deadlines. Notification/email logic kept separate from controllers/task services; email failures handled independently from task operations; duplicate reminders prevented via a `notification_log` table; no Redis/Kafka/queue infrastructure. Full detail in `PHASE_17.md` and `prompts/phase-17.md`.

**Phase 18 — Time Tracking**
Start/Pause/Resume/Stop work sessions on a task, backed by a dedicated `work_sessions` table (one row per work segment, not a single accumulated-time field). Defines interaction with ACTIVE/COMPLETED/MISSED/DELETED task states, prevents invalid/multiple-open sessions, enforces ownership, and shapes the data for a future planned-vs-actual analytics phase. Full detail in `PHASE_18.md` and `prompts/phase-18.md`.

---

## Future (not built yet — recorded for context, explicitly out of scope)

19. Projects
20. Subtasks
21. Categories & Tags
22. Planned vs Actual Time
23. Daily Planning
24. Daily/Weekly Reviews
25. Advanced Productivity Analytics
26. Scheduled/Background Processing (beyond Phase 17's in-process sweep, if ever needed)
27. Productivity Insights
28. AI Productivity Intelligence
29. AI Task Intelligence
30. Production Hardening & Optimization

Renumbered from the original list: **Time Tracking** and **Notifications & Reminders** were pulled forward to Phases 18 and 17 respectively (see above) instead of their original slots (20 and 25) — everything else keeps its original relative order, shifted down. None of the items above have prompts yet and none should be started without first drafting and getting approval for a phase prompt, following the same process as phases 0–18.
