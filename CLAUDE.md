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

**Backend:** Clerk (auth) · Supabase Postgres accessed **directly via `pg`** (NO ORM — no Prisma) · Node + Express · Zod (validation) · REST · JavaScript.

**Frontend:** React + Vite · Tailwind · Framer Motion · 21st.dev MCP for components · mobile-first (treat as mobile-only).

---

## Layered Architecture (enforce strictly)

```
Client → Route → Middleware → Controller → Service → Repository → Postgres/Supabase
```

- **Routes** — define endpoints and wire up middleware/controllers. No business logic.
- **Middleware** — Clerk auth, request validation, error handling, other shared concerns.
- **Controllers** — thin. Read the request, get the authenticated user context, invoke validation, call services, return the HTTP response. No heavy logic, no raw SQL.
- **Services** — all business/application logic and state-transition rules live here.
- **Repositories** — parameterized SQL only. Nothing else.

Do not let logic leak between layers (e.g. no SQL in controllers, no HTTP concerns in services).

---

## API Convention

REST under **`/api`**. There is **no `/v1`** segment anywhere in the API.

```
POST   /api/tasks
GET    /api/tasks            # supports ?status=ACTIVE|COMPLETED|MISSED|DELETED
GET    /api/tasks/:id
PATCH  /api/tasks/:id
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/miss   # body: { "reason": "..." }
DELETE /api/tasks/:id        # body: { "reason": "..." }
```

Do not add a generic status-update endpoint. Each lifecycle transition (complete / miss / delete) is its own dedicated operation.

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
├── status              # ACTIVE | COMPLETED | MISSED | DELETED
├── missed_reason
├── deletion_reason
├── created_at
├── updated_at
├── completed_at
├── missed_at
└── deleted_at
```

Rules:
- Use the internal `users.id` as the FK for all business data. Never scatter Clerk IDs across other tables.
- Use proper Postgres types, constraints, indexes, and enums/CHECK constraints for `status` and `priority`.
- Recommended indexes: `user_id`, `(user_id, status)`, `(user_id, deadline)`.
- UTC timestamps everywhere.

---

## Lifecycle Rules (enforced server-side, in the Service layer)

Allowed transitions only:
```
ACTIVE → COMPLETED
ACTIVE → MISSED
ACTIVE → DELETED
```
No other transition is valid. Specifically disallowed: `COMPLETED → MISSED`, `MISSED → COMPLETED`, `DELETED → anything`, or any transition out of a terminal state.

- **Complete:** only allowed on an ACTIVE task. Sets `status=COMPLETED`, `completed_at`, `updated_at` — all server-controlled. The task must leave the active collection.
- **Miss:** requires a non-empty reason. Sets `status=MISSED`, `missed_reason`, `missed_at`, `updated_at`. Never allow a miss without a reason. `missed_reason` cannot be edited via the normal update (PATCH) endpoint.
- **Delete:** soft delete only — the row stays in the database. Requires a non-empty reason. Sets `status=DELETED`, `deletion_reason`, `deleted_at`, `updated_at`. No restore functionality in Phase 1.
- Deleted, completed, and missed tasks cannot be edited or transitioned further.
- **Edit (PATCH):** only `title`, `description`, `deadline`, `priority` are editable, and only while the task is ACTIVE. The client must never be able to set `user_id`, `status`, any timestamp, `missed_reason`, or `deletion_reason` — these are always server-controlled.

---

## Security (non-negotiable)

- Ownership comes from the authenticated Clerk identity only — **never** from the request body.
- Every query must be scoped to the authenticated user.
- A user must never be able to read, edit, complete, miss, or delete another user's task.
- Always use parameterized SQL — never interpolate user input into a query string.
- Validate every request body, query param, and route param with Zod on the server.
- Reject empty or meaningless reasons (miss/delete) with `400`.
- Never expose raw SQL, Postgres error messages, stack traces, secrets, or other internals in API responses.
- Consistent JSON error shapes and correct HTTP status codes across all endpoints.

---

## Testing

Vitest + Supertest. Coverage should include: auth, authorization/ownership (including cross-user access attempts), task creation, editing, completion, missed (with reason), deletion (with reason), input validation, state-transition enforcement, and status filtering.

---

## Where to Look

- `STATE.md` — current phase, status of all phases, decisions log, how to resume.
- `PHASES.md` — full roadmap description of phases 0–16, plus future phases 17–30 (out of scope).
- `prompts/phase-XX.md` — the self-contained, ready-to-approve prompt for each phase. Do not build a phase whose prompt has not been explicitly approved by the user.
