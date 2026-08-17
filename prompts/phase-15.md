# Phase 15 — Analytics

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 15"). On completion, update `STATE.md` and stop — do not proceed to Phase 16 without separate approval.

## Goal
Deliver the first real analytics experience: analysis of completion/missed/incomplete/deleted patterns, reason analysis (why tasks were confirmed incomplete, or deleted), trends over time, and visualizations — the payoff of preserving historical task data per the project's core arc ("Understand why → Identify patterns → Improve"). Note the distinction: `MISSED` is a transient/pending status (a task shouldn't stay there — it should get resolved), so analytics should treat `INCOMPLETE` as the meaningful "didn't get done" outcome to analyze, while `MISSED` counts (especially ones sitting unresolved for a long time) are more useful as an "needs attention" signal than as a terminal-outcome metric.

> **Follow `client/DESIGN.md`.** Note that §7 deliberately leaves **chart primitives unspecified** — the palette and rules for data visualization are to be designed *as part of this phase* and then written back into `DESIGN.md` as a new section before the phase is marked Done. Charts must extend the existing token set (§2), not introduce a parallel one: the categorical series palette derives from Steel Teal / Japanese Indigo / Foggy, and the semantic colors in §2.4 keep their existing meanings (green completed, amber needs-review, Foggy not-done, grey deleted). Red stays reserved for destructive actions and must not appear in a chart.

## In scope
- **Design the chart layer and record it in `DESIGN.md`** — series palette, axis/grid treatment on a dark ground, label and numeral type (mono, `tabular-nums`), empty and loading states for charts, and the reduced-motion behavior of any chart entry animation. This is a real design deliverable of the phase, not an afterthought.
- Decide (with the user if ambiguous) whether analytics computations happen client-side (aggregating over data fetched via existing endpoints) or require new backend endpoints for aggregation (e.g. `GET /api/tasks/analytics` or similar) — given the "no `/v1`" and REST conventions in `CLAUDE.md`, any new backend endpoint must follow the same `/api` convention, layered architecture, auth, and ownership-scoping rules as everything else. This is a natural point where new backend work may be genuinely warranted — confirm scope with the user before adding new backend surface area, since `CLAUDE.md`'s security/architecture rules apply fully to any new endpoint.
- Build visualizations (charts) for:
  - Completion rate over time (including MISSED tasks later resolved to COMPLETED — worth distinguishing from on-time completions if the data makes that easy).
  - Incomplete rate over time, broken down by the user's own `incomplete_reason` where possible.
  - Unresolved-MISSED as a current "needs attention" count/list, not a historical trend (see note above).
  - Deleted rate over time, broken down by reason where possible.
  - Priority-level breakdowns (e.g. are HIGH priority tasks confirmed incomplete more often than LOW?).
- Present trends in a way that's meaningful on a mobile viewport (avoid dense desktop-style dashboards; favor a small number of clear, swipeable/stacked charts over a cramped grid). Any chart wider than the viewport scrolls inside its own container — the page body never scrolls sideways.
- Historical data integrity: rely on the fact that completed/missed/incomplete/deleted tasks are never hard-deleted (per `CLAUDE.md`), so analytics always have full history to work with.

## Out of scope
- No AI-driven insights (Phases 28/29, future/out of scope for now).
- No notifications/reminders (Phase 25, future).
- No changes to core task lifecycle rules — analytics is read-only over existing historical data.

## Files/areas to create or change
- Possibly `server/src/routes/analytics.js`, `server/src/controllers/analyticsController.js`, `server/src/services/analyticsService.js`, `server/src/repositories/analyticsRepository.js` — only if new backend aggregation endpoints are agreed with the user.
- `client/src/routes/Insights.jsx` — build out the locked placeholder created in Phase 11 (the route and its bottom-nav slot already exist per `DESIGN.md` §6; **no navigation changes are needed**).
- `client/src/components/analytics/*` — chart components (completion/incomplete/deleted trends, unresolved-missed indicator, reason breakdowns, priority breakdowns).
- `client/DESIGN.md` — add the chart/data-visualization section designed in this phase.
- `client/src/styles/tokens.css` — any chart series tokens, derived from the existing palette.

## Acceptance criteria
- [ ] `client/DESIGN.md` has a new chart/data-visualization section covering series palette, axes, labels, states, and reduced motion — written before the phase is marked Done.
- [ ] Chart colors derive from the existing token set; the §2.4 semantic colors keep their meanings, and red appears nowhere in a chart.
- [ ] Insights view is reachable from the existing bottom-nav slot and shows real data derived from the authenticated user's historical tasks.
- [ ] Completion/incomplete/deleted trends are visualized clearly, and unresolved MISSED tasks are surfaced as a "needs attention" signal.
- [ ] Reason-based breakdowns are shown for incomplete and deleted tasks.
- [ ] Priority-level breakdowns are shown.
- [ ] If new backend endpoints were added, they fully comply with `CLAUDE.md`'s architecture, auth, ownership-scoping, and validation rules — no shortcuts taken because "it's just analytics."
- [ ] Charts and layout are usable on a mobile viewport; no chart causes the page body to scroll horizontally.
- [ ] No hex values in any component file — tokens only.
- [ ] `npx impeccable` check passes (or every finding is fixed) before the phase is marked Done.
- [ ] `STATE.md` updated: Phase 15 marked `Done`, next phase noted, decisions logged (client-side vs backend aggregation, chart library choice if any, chart palette rationale).
