# Phase 2 — Database

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 2"). On completion, update `STATE.md` and stop — do not proceed to Phase 3 without separate approval.

## Goal
Set up Supabase as the database, accessed from the backend exclusively via `@supabase/supabase-js` (no ORM, no `pg`, no direct Postgres connection). Create the `users` and `tasks` schema in Supabase through Supabase's own migration flow, matching the data model in `CLAUDE.md` exactly, including constraints and indexes — then verify the resulting tables in Supabase itself.

> Note (added after this phase was completed): the `status` CHECK constraint here does not yet include `INCOMPLETE`, and `incomplete_reason`/`incomplete_at` don't exist yet. Both are added by a follow-up migration in Phase 6, once the missed-task resolution flow needs them — see `prompts/phase-06.md` and `CLAUDE.md`'s Data Model section for the current, complete schema.

## In scope
- Install `@supabase/supabase-js`.
- Create a Supabase client module (e.g. `server/src/db/supabaseClient.js`) configured from `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, as documented in `example.env`. This is the only way the backend touches the database — no `pg`, no `pg.Pool`, no Postgres connection string.
- Create the schema in Supabase via Supabase's normal migration flow (Supabase CLI migrations, e.g. `supabase migration new ...` + `supabase db push`, and/or the Supabase SQL editor) — plain SQL, no separate Node migration runner, no ORM migration system:
  - Migration SQL should live in the repo (e.g. `supabase/migrations/*.sql`) so it's reviewable and consistent with the Supabase CLI convention.
  - `users` table: `id`, `clerk_user_id` (unique), `created_at`, `updated_at`.
  - `tasks` table: `id`, `user_id` (FK → `users.id`), `title` (required), `description` (optional), `deadline` (required), `priority` (enum/CHECK: `LOW`/`MEDIUM`/`HIGH`, required), `status` (enum/CHECK: `ACTIVE`/`COMPLETED`/`MISSED`/`DELETED`), `missed_reason`, `deletion_reason`, `created_at`, `updated_at`, `completed_at`, `missed_at`, `deleted_at`.
  - Indexes: `user_id`, `(user_id, status)`, `(user_id, deadline)`.
  - Foreign key constraint from `tasks.user_id` to `users.id`.
  - UTC timestamps everywhere (`timestamptz`).
- Apply the migration to the actual Supabase project and verify the resulting `users` and `tasks` tables in Supabase (Table Editor and/or `supabase` CLI introspection) — correct columns, types, constraints, and indexes.
- A basic connectivity smoke test/manual verification (e.g. a one-off script or a temporary route removed before merge) confirming the backend can reach Supabase through the client — but do not build out full task repositories/services yet, that's Phase 3.

## Out of scope
- No task CRUD routes/controllers/services (Phase 3).
- No Zod validation (Phase 4).
- No automatic missed-task processing (Phase 6).
- No ORM (Prisma or otherwise) — Supabase client only, per `CLAUDE.md`.
- No `pg`, no `pg.Pool`, no direct Postgres connection string anywhere in the codebase.
- No separate Postgres migration framework beyond Supabase's own migration flow.

## Files/areas to create or change
- `server/src/db/supabaseClient.js` (or similar) — Supabase client setup from env.
- `supabase/migrations/*.sql` (or equivalent Supabase migration flow) — schema for `users` and `tasks`.
- Update `package.json` deps for `@supabase/supabase-js`.
- `example.env` is already updated with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — confirm the code reads exactly those names.

## Acceptance criteria
- [ ] `@supabase/supabase-js` installed; no `pg` and no ORM package installed anywhere in the repo.
- [ ] Supabase client module created and configured from `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Migration applied through Supabase's normal migration flow creates `users` and `tasks` tables matching the data model exactly, including constraints and indexes described in `CLAUDE.md`.
- [ ] `status` and `priority` are enforced via Postgres enum types or CHECK constraints — verified in Supabase (e.g. an invalid value is rejected at the DB level).
- [ ] Foreign key from `tasks.user_id` to `users.id` is verified in Supabase.
- [ ] All timestamp columns use `timestamptz` (UTC), verified in Supabase.
- [ ] Backend successfully connects to and queries Supabase via `@supabase/supabase-js` (smoke-tested).
- [ ] No ORM, no `pg`, and no direct Postgres connection introduced anywhere in the codebase.
- [ ] `STATE.md` updated: Phase 2 marked `Done`, next phase noted, schema/migration decisions (exact enum vs CHECK choice, migration approach used) logged in Decisions log.
