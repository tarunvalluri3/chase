# Phase 15 — Analytics

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 15"). On completion, update `STATE.md` and stop — do not proceed to Phase 16 without separate approval.

## Goal
Deliver the first real analytics experience: analysis of completion/missed/deleted patterns, reason analysis (why tasks are missed/deleted), trends over time, and visualizations — the payoff of preserving historical task data per the project's core arc ("Understand why → Identify patterns → Improve").

## In scope
- Decide (with the user if ambiguous) whether analytics computations happen client-side (aggregating over data fetched via existing endpoints) or require new backend endpoints for aggregation (e.g. `GET /api/tasks/analytics` or similar) — given the "no `/v1`" and REST conventions in `CLAUDE.md`, any new backend endpoint must follow the same `/api` convention, layered architecture, auth, and ownership-scoping rules as everything else. This is a natural point where new backend work may be genuinely warranted — confirm scope with the user before adding new backend surface area, since `CLAUDE.md`'s security/architecture rules apply fully to any new endpoint.
- Build visualizations (charts) for:
  - Completion rate over time.
  - Missed rate over time, broken down by reason where possible.
  - Deleted rate over time, broken down by reason where possible.
  - Priority-level breakdowns (e.g. are HIGH priority tasks missed more often than LOW?).
- Present trends in a way that's meaningful on a mobile viewport (avoid dense desktop-style dashboards; favor a small number of clear, swipeable/stacked charts over a cramped grid).
- Historical data integrity: rely on the fact that completed/missed/deleted tasks are never hard-deleted (per `CLAUDE.md`), so analytics always have full history to work with.

## Out of scope
- No AI-driven insights (Phases 28/29, future/out of scope for now).
- No notifications/reminders (Phase 25, future).
- No changes to core task lifecycle rules — analytics is read-only over existing historical data.

## Files/areas to create or change
- Possibly `server/src/routes/analytics.js`, `server/src/controllers/analyticsController.js`, `server/src/services/analyticsService.js`, `server/src/repositories/analyticsRepository.js` — only if new backend aggregation endpoints are agreed with the user.
- `client/src/routes/Analytics.jsx` (new route, linked from navigation).
- `client/src/components/analytics/*` — chart components (completion/missed/deleted trends, reason breakdowns, priority breakdowns).
- Update navigation (Phase 11's shell) to include an Analytics entry.

## Acceptance criteria
- [ ] Analytics view is reachable from navigation and shows real data derived from the authenticated user's historical tasks.
- [ ] Completion/missed/deleted trends are visualized clearly.
- [ ] Reason-based breakdowns are shown for missed and deleted tasks.
- [ ] Priority-level breakdowns are shown.
- [ ] If new backend endpoints were added, they fully comply with `CLAUDE.md`'s architecture, auth, ownership-scoping, and validation rules — no shortcuts taken because "it's just analytics."
- [ ] Charts and layout are usable on a mobile viewport.
- [ ] `STATE.md` updated: Phase 15 marked `Done`, next phase noted, decisions logged (client-side vs backend aggregation, chart library choice if any).
