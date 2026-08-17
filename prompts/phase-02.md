# Phase 2 — Database

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 2"). On completion, update `STATE.md` and stop — do not proceed to Phase 3 without separate approval.

## Goal
Set up Supabase Postgres access via `pg` (no ORM), with a connection pool, schema/migration for `users` and `tasks`, and correct constraints/indexes matching the data model in `CLAUDE.md`.

## In scope
- Install `pg`.
- Create a database connection module using a connection pool (`pg.Pool`), configured from `DATABASE_URL` (or discrete `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` vars) as documented in `example.env`.
- Create migration/schema SQL (plain `.sql` files or a minimal hand-rolled migration runner — no heavyweight migration framework unless the user requests one) for:
  - `users` table: `id`, `clerk_user_id` (unique), `created_at`, `updated_at`.
  - `tasks` table: `id`, `user_id` (FK → `users.id`), `title` (required), `description` (optional), `deadline` (required), `priority` (enum/CHECK: `LOW`/`MEDIUM`/`HIGH`, required), `status` (enum/CHECK: `ACTIVE`/`COMPLETED`/`MISSED`/`DELETED`), `missed_reason`, `deletion_reason`, `created_at`, `updated_at`, `completed_at`, `missed_at`, `deleted_at`.
  - Indexes: `user_id`, `(user_id, status)`, `(user_id, deadline)`.
  - Foreign key constraint from `tasks.user_id` to `users.id`.
  - UTC timestamps everywhere (`timestamptz`).
- A simple, documented way to run the migration against a Supabase Postgres instance (e.g. an npm script that runs the SQL file via `pg`).
- A basic repository-layer smoke test or manual verification path (e.g. a one-off script or a temporary route removed before merge) to confirm the connection pool works — but do not build out full task repositories/services yet, that's Phase 3.

## Out of scope
- No task CRUD routes/controllers/services (Phase 3).
- No Zod validation (Phase 4).
- No automatic missed-task processing (Phase 6).
- No ORM (Prisma or otherwise) — raw `pg` only, per `CLAUDE.md`.

## Files/areas to create or change
- `server/src/db/pool.js` (or similar) — connection pool setup.
- `server/src/db/migrations/*.sql` (or a single init script) — schema for `users` and `tasks`.
- An npm script (e.g. `npm run migrate`) to apply the schema.
- Update `example.env` only if new variables are discovered to be necessary (unlikely — it already covers `DATABASE_URL` and discrete PG vars).

## Acceptance criteria
- [ ] `pg` installed and a connection pool module created, configured from env.
- [ ] Migration creates `users` and `tasks` tables matching the data model exactly, including constraints and indexes described in `CLAUDE.md`.
- [ ] `status` and `priority` are enforced via Postgres enum types or CHECK constraints — invalid values are rejected at the DB level.
- [ ] Foreign key from `tasks.user_id` to `users.id` is enforced.
- [ ] All timestamp columns use `timestamptz` (UTC).
- [ ] Migration is runnable via a documented npm script against a Supabase Postgres instance.
- [ ] No ORM introduced.
- [ ] `STATE.md` updated: Phase 2 marked `Done`, next phase noted, schema decisions (exact enum vs CHECK choice, migration approach) logged in Decisions log.
