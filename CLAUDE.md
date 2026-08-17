# CLAUDE.md — Durable Rules for the Chase Project

## SESSION-START ROUTINE (do this before anything else, every session)

At the start of every new session:
1. Read this file (`CLAUDE.md`) in full.
2. Read `STATE.md` in full.
3. Determine from `STATE.md` which phase is current and whether it has been **approved**.
4. State back to the user, in one or two lines, what phase we're on and what you understand the next step to be.
5. **Wait.** Do not take any action — do not write code, do not run commands beyond read-only inspection — until the user responds.

Never act on an unapproved phase, no matter how small or obvious the work seems.

---

## THE GOVERNING RULE: One phase at a time, nothing without approval

Chase is built **strictly one phase at a time**. Nothing is built without explicit approval from the user.

- All phase prompts live in `prompts/phase-00.md` through `prompts/phase-16.md`. Each is self-contained and describes exactly one phase's goal, scope, files to touch, and acceptance criteria.
- A phase prompt existing, or being well-written, is **not** approval to build it.
- The user grants approval explicitly — e.g. "Approved — build Phase 3." Only then implement that specific phase.
- If the user has not approved a phase, do not write code for it, even if it seems trivial, even if it would be convenient to bundle with other work.
- After finishing an approved phase:
  1. Update `STATE.md` (status table, current phase, decisions log if relevant).
  2. Print a summary of what changed.
  3. **Stop.** Wait for approval before starting the next phase.
- If anything about a phase is ambiguous, ask the user — do not guess or assume scope.
- Future phases (17–30, listed in `PHASES.md`) are recorded for context only and are explicitly out of scope until much later, if ever.

---

## Project Summary

Chase is a personal work & productivity tracking app — more than a todo app. The long-term arc:

**Plan work → Execute → Record what happened → Understand why → Identify patterns → Improve.**

It must preserve meaningful history: completed, missed (with reason), and deleted (with reason) tasks are all kept as historical data that will later power analytics. The product is built incrementally, feature by feature — never all at once.

---

## Tech Stack

**Backend:** Clerk (auth) · Supabase (database) accessed **via `@supabase/supabase-js`** — NO ORM (no Prisma, no Sequelize, no Drizzle, no TypeORM), NO `pg`, NO direct Postgres connection · Node + Express · Zod (validation) · REST · JavaScript.

**Frontend:** React + Vite · Tailwind · Framer Motion · 21st.dev MCP for components · mobile-first (treat as mobile-only).

---

## Database Architecture (non-negotiable)

- **Database:** Supabase.
- **Database client:** `@supabase/supabase-js`, used server-side only (the frontend never talks to Supabase directly — all data access goes through the Express API).
- **ORM:** none. Do not introduce Prisma, Sequelize, Drizzle, TypeORM, or any other ORM in this project unless the user explicitly approves it in a future session.
- **PostgreSQL driver (`pg`):** not used. No `pg.Pool`, no raw Postgres connection string, no direct Postgres connection of any kind.
- **Schema/migrations:** created and applied through Supabase's own migration flow (Supabase CLI migrations and/or the Supabase SQL editor) — plain SQL, reviewable in-repo. Do not introduce a separate Node/`pg`-based migration runner or an ORM migration system.
- **Required env vars:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (documented in `example.env`). Use these exact names consistently across code, `CLAUDE.md`, and phase prompts.

---

## Layered Architecture (enforce strictly)

```
Client → Route → Middleware → Controller → Service → Repository → Supabase
```

- **Routes** — define endpoints and wire up middleware/controllers. No business logic.
- **Middleware** — Clerk auth, request validation, error handling, other shared concerns.
- **Controllers** — thin. Read the request, get the authenticated user context, invoke validation, call services, return the HTTP response. No heavy logic, no raw SQL.
- **Services** — all business/application logic and state-transition rules live here.
- **Repositories** — Supabase client (`@supabase/supabase-js`) calls only. Nothing else.

Do not let logic leak between layers (e.g. no Supabase calls in controllers, no HTTP concerns in services).

---

## API Convention

REST under **`/api`**. There is **no `/v1`** segment anywhere in the API.

```
POST   /api/tasks
GET    /api/tasks               # supports ?status=ACTIVE|COMPLETED|MISSED|INCOMPLETE|DELETED
GET    /api/tasks/:id
PATCH  /api/tasks/:id
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/resolve-missed   # body: { "resolution": "INCOMPLETE", "reason": "..." } | { "resolution": "COMPLETED" }
DELETE /api/tasks/:id           # body: { "reason": "..." }
```

Do not add a generic status-update endpoint. Each lifecycle transition (complete / resolve-missed / delete) is its own dedicated operation.

There is **no** `POST /api/tasks/:id/miss` endpoint. `MISSED` is never set directly by a client — see Lifecycle Rules below. `resolve-missed` is the only path into both `INCOMPLETE` and a MISSED-originated `COMPLETED`.

---

## Data Model

```
users
├── id
├── clerk_user_id
├── created_at
└── updated_at

tasks
├── id
├── user_id            # FK -> users.id (internal id, NOT the Clerk id)
├── title               # required
├── description         # optional
├── deadline            # required
├── priority            # LOW | MEDIUM | HIGH (required)
├── status              # ACTIVE | COMPLETED | MISSED | INCOMPLETE | DELETED
├── missed_reason        # auto-generated when ACTIVE -> MISSED; preserved forever, even past resolution
├── incomplete_reason    # user-provided when resolving MISSED -> INCOMPLETE; required, non-empty
├── deletion_reason
├── created_at
├── updated_at
├── completed_at         # set on ACTIVE -> COMPLETED, or on MISSED -> COMPLETED via resolve-missed
├── missed_at
├── incomplete_at         # set on MISSED -> INCOMPLETE via resolve-missed
└── deleted_at
```

Rules:
- Use the internal `users.id` as the FK for all business data. Never scatter Clerk IDs across other tables.
- Use proper Postgres types, constraints, indexes, and enums/CHECK constraints for `status` and `priority`.
- Recommended indexes: `user_id`, `(user_id, status)`, `(user_id, deadline)`.
- UTC timestamps everywhere.
- `missed_reason`/`missed_at` and `incomplete_reason`/`incomplete_at` are distinct and both preserved: the former records *when/why the system detected the task as overdue*, the latter records *the user's own account of why it wasn't actually done*. Neither is overwritten by the other.

---

## Lifecycle Rules (enforced server-side, in the Service layer)

```
ACTIVE
  ├─ user marks Complete            → COMPLETED
  ├─ user deletes (with reason)     → DELETED
  └─ deadline passes while ACTIVE   → MISSED   (automatic, never client-initiated; pending resolution)

MISSED  (a pending-resolution checkpoint, not itself a verdict)
  ├─ user resolves, with reason: "I didn't actually complete this" → INCOMPLETE (terminal)
  └─ user resolves: "I actually completed this"                    → COMPLETED  (terminal)
```

**`MISSED` does not mean "the work was never done."** It means only: *the deadline passed without the system receiving a completion confirmation.* A user can forget to tap Complete on work they actually finished, so an overdue ACTIVE task must never be treated as a definitive "incomplete" verdict on its own — it's a checkpoint that always requires the user to resolve it one way or the other. `INCOMPLETE` is the actual, explicit "this was never done" verdict, and it only exists once the user has confirmed it and stated why. Do not write logic anywhere (service, docs, UI copy) that treats "deadline passed" (i.e. `MISSED`) as synonymous with "task was never completed" (i.e. `INCOMPLETE`) — they are different statuses with different meanings.

Allowed transitions only: `ACTIVE→COMPLETED`, `ACTIVE→DELETED`, `ACTIVE→MISSED` (automatic only — see Phase 6), `MISSED→INCOMPLETE` and `MISSED→COMPLETED` (only via the explicit resolution flow below). No other transition is valid. Specifically disallowed: `COMPLETED → anything`, `DELETED → anything`, `INCOMPLETE → anything`, `MISSED → DELETED`, `MISSED → ACTIVE`, or any transition out of a terminal state. `ACTIVE`, `COMPLETED`, `DELETED`, and `INCOMPLETE` are all terminal-or-normal states with no further transitions except the ones listed; `MISSED` is the one non-terminal, pending state — every MISSED task must eventually be resolved to either `INCOMPLETE` or `COMPLETED`.

- **Complete:** only allowed on an ACTIVE task. Sets `status=COMPLETED`, `completed_at`, `updated_at` — all server-controlled. The task must leave the active collection.
- **Automatic missed detection (`ACTIVE → MISSED`):** never client-initiated — there is no endpoint for a user or client to directly set `status=MISSED`. The system transitions an ACTIVE task to MISSED once its `deadline` has passed (mechanism defined in Phase 6). Sets `status=MISSED`, an auto-generated `missed_reason` (e.g. `"Deadline passed while task was still ACTIVE"`), `missed_at`, `updated_at`.
- **Resolve missed (`POST /api/tasks/:id/resolve-missed`):** only allowed on a task currently `MISSED`.
  - `{ "resolution": "INCOMPLETE", "reason": "..." }` — user confirms the task genuinely was never completed, and must supply a non-empty reason (same "reject empty/meaningless reasons with 400" rule as delete). Sets `status=INCOMPLETE`, `incomplete_reason`, `incomplete_at`, `updated_at`. The original `missed_reason`/`missed_at` are kept untouched as the record of when/why it was auto-detected as overdue. Terminal — an `INCOMPLETE` task cannot be edited or transitioned further.
  - `{ "resolution": "COMPLETED" }` — user confirms the work was actually done; no reason needed. Sets `status=COMPLETED`, `completed_at`, `updated_at`. `missed_at`/`missed_reason` are **not** cleared — they remain as history showing the task passed through MISSED before being confirmed complete. Terminal — an ordinary COMPLETED task from here on, cannot be edited or transitioned further.
- **Delete:** soft delete only — the row stays in the database. Requires a non-empty reason. Sets `status=DELETED`, `deletion_reason`, `deleted_at`, `updated_at`. No restore functionality in Phase 1. (Delete is only reachable from ACTIVE — a MISSED task must be resolved, not deleted, and INCOMPLETE/COMPLETED/DELETED are already terminal.)
- Deleted, completed, and incomplete tasks cannot be edited or transitioned further. A MISSED task cannot be edited, but can be transitioned exactly once, via `resolve-missed`.
- **Edit (PATCH):** only `title`, `description`, `deadline`, `priority` are editable, and only while the task is ACTIVE. The client must never be able to set `user_id`, `status`, any timestamp, `missed_reason`, `incomplete_reason`, or `deletion_reason` — these are always server-controlled.

---

## Security (non-negotiable)

- Ownership comes from the authenticated Clerk identity only — **never** from the request body.
- Every query must be scoped to the authenticated user.
- A user must never be able to read, edit, complete, miss, or delete another user's task.
- Always use the Supabase client's query builder — never build raw SQL strings from user input.
- Validate every request body, query param, and route param with Zod on the server.
- Reject empty or meaningless reasons (`resolve-missed` with `resolution=INCOMPLETE` / delete) with `400`.
- Never expose raw SQL, Supabase/Postgres error messages, stack traces, secrets, or other internals in API responses.
- Consistent JSON error shapes and correct HTTP status codes across all endpoints.

---

## Testing

Vitest + Supertest. Coverage should include: auth, authorization/ownership (including cross-user access attempts), task creation, editing, completion, automatic missed detection, missed-resolution to `INCOMPLETE` (with required reason) and to `COMPLETED`, deletion (with reason), input validation, state-transition enforcement, and status filtering.

---

## Where to Look

- `STATE.md` — current phase, status of all phases, decisions log, how to resume.
- `PHASES.md` — full roadmap description of phases 0–16, plus future phases 17–30 (out of scope).
- `prompts/phase-XX.md` — the self-contained, ready-to-approve prompt for each phase. Do not build a phase whose prompt has not been explicitly approved by the user.
- `client/DESIGN.md` — **the authoritative design system for all frontend work (Phases 9–16).** Color, typography, space, motion, navigation, component inventory and behavior, copy voice, accessibility, and the mobile production checklist. Read it in full before starting any frontend phase. This file (`CLAUDE.md`) still governs architecture, lifecycle rules, and the approval workflow and wins on those; `DESIGN.md` governs everything visual and interactive. Its "Approved decisions" table is settled — do not relitigate those mid-phase.
