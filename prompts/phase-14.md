# Phase 14 — Dashboard

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 14"). On completion, update `STATE.md` and stop — do not proceed to Phase 15 without separate approval.

## Goal
Build a Home/Dashboard view giving the user a quick overview of their task landscape: counts per status, summaries, and recent activity — using only data already available from existing endpoints (no new backend analytics endpoints yet; that's Phase 15's deeper territory, though simple client-side aggregation of existing `GET /api/tasks` data is fine here).

## In scope
- Build the Home route (placeholder since Phase 11) into a real dashboard.
- Show task counts by status (Active/Completed/Missed/Incomplete/Deleted) — computed client-side from existing list endpoints, or via lightweight additional `GET /api/tasks?status=` calls per status (avoid adding new backend aggregation endpoints in this phase — keep it simple, revisit if performance becomes a real issue).
- Show a short "recent activity" list (e.g. most recently updated/completed/missed/confirmed-incomplete/deleted tasks) using existing data sorted client-side.
- Highlight anything time-sensitive if easy to derive from existing data (e.g. active tasks with near/passed deadlines) — keep this simple, not a full analytics feature.
- Keep the dashboard visually simple, mobile-first, consistent with the app shell from Phase 11.

## Out of scope
- No deep analytics, trends, charts, or reason-pattern analysis (Phase 15).
- No new backend aggregation endpoints — if it becomes clear during this phase that one is genuinely needed, stop and ask the user rather than expanding scope unilaterally.

## Files/areas to create or change
- `client/src/routes/Home.jsx` — real dashboard content.
- `client/src/components/dashboard/StatusCounts.jsx`, `RecentActivity.jsx` (or similar).
- Possibly a small client-side data-aggregation utility (e.g. `client/src/lib/taskStats.js`) for computing counts/recency from fetched task lists.

## Acceptance criteria
- [ ] Home/Dashboard shows accurate counts for Active/Completed/Missed/Incomplete/Deleted tasks for the authenticated user.
- [ ] A recent-activity summary is shown, reflecting real recent task events.
- [ ] All data is correctly scoped to the authenticated user (relies on existing backend scoping — no new security surface introduced).
- [ ] No new backend endpoints added without explicit user approval/discussion.
- [ ] Dashboard is visually simple, clear, and usable on a mobile viewport.
- [ ] `STATE.md` updated: Phase 14 marked `Done`, next phase noted, decisions logged (client-side vs endpoint-based aggregation choice).
