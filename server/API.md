# Chase Backend API

Base URL: `/api`. There is no `/v1` segment anywhere in this API.

All request/response bodies are JSON. All timestamps are UTC, ISO 8601. All JSON field names are `snake_case` throughout — task fields mirror the database columns directly, and `/api/me` follows the same convention for consistency.

## Authentication

Every route except `GET /api/health` requires a valid Clerk session. Auth is verified from the request's Clerk session — never from the request body. An unauthenticated request to any protected route returns:

```
401 Unauthorized
{ "error": { "message": "Unauthorized" } }
```

## Error shape

Every error response, from every endpoint, has this shape:

```
{
  "error": {
    "message": "human-readable summary",
    "details": [ { "path": "fieldName", "message": "..." }, ... ]   // present only on 400 validation errors
  }
}
```

`details` is omitted entirely (not an empty array) when there's nothing field-specific to report.

### Status codes used across the API

| Status | Meaning | When |
|---|---|---|
| `200` | Success | Successful read or mutation |
| `201` | Created | Successful `POST /api/tasks` |
| `400` | Validation error | Malformed body/query/param (Zod validation failure, including empty/whitespace-only `reason`), or a malformed JSON request body |
| `401` | Unauthorized | No valid Clerk session |
| `404` | Not found | Task id doesn't exist, or exists but belongs to another user (both cases return an identical response — no existence/ownership leakage), or the requested route doesn't exist at all |
| `409` | Invalid state transition | The requested lifecycle transition isn't legal for the task's current status |
| `500` | Internal server error | Unexpected server-side failure; message is always generic, real error is logged server-side only |

## Task object

Returned by every task endpoint (on success):

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "description": "string | null",
  "deadline": "timestamptz",
  "priority": "LOW | MEDIUM | HIGH",
  "status": "ACTIVE | COMPLETED | MISSED | INCOMPLETE | DELETED",
  "missed_reason": "string | null",
  "incomplete_reason": "string | null",
  "deletion_reason": "string | null",
  "created_at": "timestamptz",
  "updated_at": "timestamptz",
  "completed_at": "timestamptz | null",
  "missed_at": "timestamptz | null",
  "incomplete_at": "timestamptz | null",
  "deleted_at": "timestamptz | null"
}
```

`user_id` is the caller's own internal id — safe to return since every task in a response is always the caller's own (or, for the sweep endpoint, a set of the caller's own tasks).

---

## `GET /api/health`

No auth required.

**Response `200`**
```json
{ "status": "ok" }
```

---

## `GET /api/me`

**Auth:** required.

**Response `200`**
```json
{ "clerk_user_id": "string" }
```

**Errors:** `401`.

---

## `POST /api/tasks`

Creates a new task. Always starts `ACTIVE`.

**Auth:** required.

**Request body**
```json
{
  "title": "string, required, non-empty after trim",
  "description": "string, optional, non-empty after trim if present, nullable",
  "deadline": "date/datetime, required, coerced from any parseable string",
  "priority": "LOW | MEDIUM | HIGH, required"
}
```
Unknown fields (e.g. `status`, `user_id`, any timestamp) are rejected — the schema is strict, not silently-dropping.

**Response `201`** — the created task object.

**Errors:** `400` (missing/invalid field, or an unknown/system-controlled field present), `401`.

---

## `GET /api/tasks`

Lists the caller's own tasks.

**Auth:** required.

**Query params**
- `status` (optional) — one of `ACTIVE | COMPLETED | MISSED | INCOMPLETE | DELETED`. Filters the list to that status.

Before returning, every `ACTIVE` task in the caller's full task set whose `deadline` has passed is lazily transitioned to `MISSED` first (see "Automatic missed detection" below), so the returned list — and any `status` filter applied to it — always reflects each task's true current status, never a stale `ACTIVE`.

**Response `200`** — array of task objects (only the caller's own; never another user's).

**Errors:** `400` (invalid `status` value), `401`.

---

## `GET /api/tasks/:id`

Gets a single task by id.

**Auth:** required. Ownership-scoped — a foreign or nonexistent id returns the same `404`.

Same lazy missed-detection as the list endpoint applies to this single task before it's returned.

**Response `200`** — the task object.

**Errors:** `400` (`:id` not a valid UUID), `401`, `404` (not found / not owned).

---

## `PATCH /api/tasks/:id`

Edits an `ACTIVE` task. Only `ACTIVE` tasks can be edited.

**Auth:** required. Ownership-scoped.

**Request body** — at least one of:
```json
{
  "title": "string, non-empty after trim",
  "description": "string, non-empty after trim, nullable",
  "deadline": "date/datetime",
  "priority": "LOW | MEDIUM | HIGH"
}
```
Unknown/system-controlled fields (`status`, `user_id`, any timestamp, `missed_reason`, `incomplete_reason`, `deletion_reason`) are rejected. An empty body is rejected.

**Response `200`** — the updated task object.

**Errors:** `400` (validation, empty body, or unknown field), `401`, `404` (not found / not owned), `409` (task isn't `ACTIVE`).

---

## `POST /api/tasks/:id/complete`

Marks an `ACTIVE` task complete. Only `ACTIVE` tasks can be completed directly this way — a `MISSED` task must go through `resolve-missed` instead.

**Auth:** required. Ownership-scoped.

**Request body:** none.

**Response `200`** — the task object with `status: "COMPLETED"`, `completed_at` set.

**Errors:** `400` (`:id` not a valid UUID), `401`, `404` (not found / not owned), `409` (task isn't `ACTIVE`).

---

## `POST /api/tasks/:id/resolve-missed`

Resolves a `MISSED` task. `MISSED` is a pending-resolution checkpoint, not a verdict — this is the only way out of it, in either direction. If the task is still `ACTIVE` but its deadline has already passed, it's lazily transitioned to `MISSED` first and then resolved in the same call.

**Auth:** required. Ownership-scoped.

**Request body — one of two shapes:**

Confirming the task genuinely was never done:
```json
{ "resolution": "INCOMPLETE", "reason": "string, required, non-empty after trim" }
```
→ `status` becomes `INCOMPLETE` (terminal). Sets `incomplete_reason`, `incomplete_at`. The original `missed_reason`/`missed_at` are preserved untouched.

Confirming the work was actually done (user forgot to tap Complete):
```json
{ "resolution": "COMPLETED" }
```
A stray `reason` field on this branch is rejected. → `status` becomes `COMPLETED` (terminal). Sets `completed_at`. `missed_reason`/`missed_at` are preserved untouched as history; `incomplete_reason`/`incomplete_at` stay `null`.

**Response `200`** — the updated task object.

**Errors:** `400` (`:id` not a valid UUID; missing/invalid `resolution`; `INCOMPLETE` without a non-empty `reason`; stray `reason` on `COMPLETED`), `401`, `404` (not found / not owned), `409` (task's current status isn't `MISSED` — includes an `ACTIVE` task whose deadline hasn't passed, and already-terminal `COMPLETED`/`INCOMPLETE`/`DELETED` tasks).

---

## `DELETE /api/tasks/:id`

Soft-deletes an `ACTIVE` task (row is kept, `status` set to `DELETED`). Only `ACTIVE` tasks can be deleted — a `MISSED` task must be resolved, not deleted.

**Auth:** required. Ownership-scoped.

**Request body**
```json
{ "reason": "string, required, non-empty after trim" }
```

**Response `200`** — the task object with `status: "DELETED"`, `deletion_reason`, `deleted_at` set.

**Errors:** `400` (`:id` not a valid UUID; missing/empty `reason`), `401`, `404` (not found / not owned), `409` (task isn't `ACTIVE`).

---

## `POST /api/tasks/sweep-missed`

Bulk-transitions all of the caller's own `ACTIVE` tasks whose `deadline` has passed to `MISSED`, in a single query. This is the same underlying check the lazy per-read transition uses — it exists as a callable operation so a future scheduler (out of scope for now — no cron/worker is wired up) can invoke it proactively instead of relying solely on the next read.

**Auth:** required. Scoped to the caller's own tasks only.

**Request body:** none.

**Response `200`** — array of the task objects that were transitioned (possibly empty).

**Errors:** `401`.

---

## Automatic missed detection

There is no client-facing way to set `status: "MISSED"` directly — no `POST /api/tasks/:id/miss` endpoint exists, and `status` is rejected as an unknown/system-controlled field on create and edit. `MISSED` is exclusively system-detected: an `ACTIVE` task whose `deadline` has passed is transitioned automatically, either lazily (the first time it's read via `GET /api/tasks` or `GET /api/tasks/:id`, including indirectly via `resolve-missed`) or via the explicit `POST /api/tasks/sweep-missed` bulk operation. The transition sets `status: "MISSED"`, an auto-generated `missed_reason` (`"Deadline passed while task was still ACTIVE"`), and `missed_at`. `COMPLETED`, `INCOMPLETE`, and `DELETED` tasks are never touched by this check regardless of their `deadline`, and an already-`MISSED` task is never reprocessed.

---

## Environment variables

See `example.env` at the repo root for the full list and current values (never committed with real secrets). What each does and where it's used:

| Variable | Used by | Purpose |
|---|---|---|
| `NODE_ENV` | server startup | Standard Node environment flag |
| `PORT` | `server/src/index.js` | Port the Express server listens on (defaults to `8080` if unset) |
| `CORS_ORIGIN` | `server/src/app.js` | Comma-separated allowlist of frontend origins permitted by CORS (defaults to `http://localhost:5173`); requests from any other origin get no `Access-Control-Allow-Origin` header |
| `SUPABASE_URL` | `server/src/db/supabaseClient.js` | Supabase project URL, used to create the `@supabase/supabase-js` client |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/src/db/supabaseClient.js` | Service-role key for the Supabase client — server-side only, never sent to the frontend |
| `CLERK_SECRET_KEY` | `@clerk/express` (via `clerkMiddleware()` in `server/src/middleware/auth.js`) | Backend Clerk secret, used to verify session tokens |
| `CLERK_PUBLISHABLE_KEY` | `@clerk/express` | Clerk publishable key (backend copy; the frontend has its own `VITE_`-prefixed one) |
| `VITE_API_BASE_URL` | frontend (`client/.env`) | Base URL the frontend's API client points at |
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend (`client/.env`) | Clerk publishable key for the frontend SDK |

None of these are read directly by test code beyond what `server/tests/setup.js` needs (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, since tests run against the real Supabase project — see `STATE.md`'s Phase 7 decisions for why); `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` are irrelevant to the test suite since `@clerk/express` is fully mocked there.
