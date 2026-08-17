# PHASES.md — Chase Roadmap

Chase is built strictly one phase at a time, with explicit approval required before any phase is implemented. See `CLAUDE.md` for the governing workflow rule and `STATE.md` for current progress.

---

## Phases 0–16 (in scope, prompts drafted in `prompts/`)

**Phase 0 — Project Foundation**
Create `client/` & `server/`, `.gitkeep` in `client/`, init Node/Express backend, install deps, env config, basic server structure, middleware foundation, error-handling foundation, health-check endpoint.

**Phase 1 — Authentication**
Clerk integration, auth middleware, protected routes, authenticated user context, user identity handling.

**Phase 2 — Database**
Supabase setup via `@supabase/supabase-js` (no ORM, no `pg`), schema/migrations through Supabase's own migration flow, `users` table, `tasks` table, relationships/constraints/indexes.

**Phase 3 — Core Task REST API**
Create / list / get-one / edit, complete, miss (require reason), soft delete (require reason), status filtering, full lifecycle enforcement.

**Phase 4 — Validation & Error Handling**
Zod schemas, body + query/param validation, consistent API responses, centralized error handling, invalid-transition handling, DB error handling.

**Phase 5 — Authorization & Security**
Ownership, prevent cross-user access, secure all task queries, protect system-controlled fields, auth/authz hardening, security review.

**Phase 6 — Automatic Task Status Handling**
Deadline-based missed processing, correct timestamps, prevent bad transitions, reliable overdue handling, kept ready for future scheduled processing (mechanism documented in `prompts/phase-06.md`).

**Phase 7 — Backend Testing**
Auth, authorization/cross-user, CRUD, completion, missed + reason, deletion + reason, validation, state-transition tests.

**Phase 8 — Backend Completion & API Documentation**
Final API contracts, endpoint/request/response/error/env docs, final backend review, confirm backend is ready for frontend.

**Phase 9 — Frontend Foundation**
React/Vite setup, deps, routing, API client, auth integration, global app structure, basic UI system.

**Phase 10 — Authentication Frontend**
Login, signup, logout, protected app routes, session handling.

**Phase 11 — Application Shell**
Main layout, navigation, sidebar/header, responsive structure, Home/Active/Completed/Missed/Deleted sections.

**Phase 12 — Task Management UI**
Create task, task list, cards/items, task details, edit, deadline & priority display, loading/empty/error states.

**Phase 13 — Task Lifecycle UI**
Complete, miss (collect reason), delete (collect reason), correct status display, confirmation flows.

**Phase 14 — Dashboard**
Overview, task counts, active/completed/missed/deleted summaries, recent activity.

**Phase 15 — Analytics**
Completion/missed/deleted analysis, reason analysis, trends, charts/visualizations, historical analysis.

**Phase 16 — Frontend Testing & Polish**
Component tests, API integration tests, auth-flow tests, task-workflow tests, responsive behavior, UX refinement, performance/accessibility review.

---

## Future (not built yet — recorded for context, explicitly out of scope)

17. Projects
18. Subtasks
19. Categories & Tags
20. Time Tracking
21. Planned vs Actual Time
22. Daily Planning
23. Daily/Weekly Reviews
24. Advanced Productivity Analytics
25. Notifications & Reminders
26. Scheduled/Background Processing
27. Productivity Insights
28. AI Productivity Intelligence
29. AI Task Intelligence
30. Production Hardening & Optimization

None of these have prompts yet and none should be started without first drafting and getting approval for a phase prompt, following the same process as phases 0–16.
