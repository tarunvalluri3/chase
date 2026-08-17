# Phase 16 — Frontend Testing & Polish

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 16"). On completion, update `STATE.md` and stop. This is the last phase in the currently-scoped roadmap (0–16) — do not begin any Phase 17+ work without a newly drafted and approved phase prompt, per `PHASES.md`.

## Goal
Close out the initial full-stack build with frontend test coverage and a polish pass: component tests, API integration tests, auth-flow tests, task-workflow tests, responsive behavior verification, UX refinement, and a performance/accessibility review.

## In scope
- Set up a frontend test runner (Vitest is already used on the backend — reuse it for consistency, with React Testing Library for component tests) and any needed test utilities (mocking the API client, mocking Clerk auth state).
- Write component tests for key building blocks: `TaskForm`, `TaskCard`, `TaskDetail`, `ResolveSheet`, `DeleteSheet`, `ReasonField`, `BottomNav`, `StatusChip`, `PriorityRail`, dashboard components, analytics chart components (rendering/props correctness, not pixel-perfect visuals).
- Write integration-style tests for core flows against a mocked API layer: creating a task, editing a task, completing/deleting a task, resolving a MISSED task to both `COMPLETED` and `INCOMPLETE`, filtering by status, viewing the dashboard, viewing insights. (There is no manual "miss" flow to test — `MISSED` only ever arises automatically.)
- Assert the lifecycle affordance rules from `DESIGN.md` §7.3 directly: Complete/Edit/Delete render only on `ACTIVE`, Resolve only on `MISSED`, and nothing renders on `COMPLETED`/`INCOMPLETE`/`DELETED`.
- Write auth-flow tests: protected routes redirect when unauthenticated, render when authenticated (using mocked Clerk state).
- Verify behavior specifically on mobile viewport sizes (the app's actual target, per `CLAUDE.md`) — check for overflow, tap-target sizing, readability, safe-area clearance on a notched device, and layout survival at 200% OS text scaling.
- **Audit the whole client against `client/DESIGN.md`** and fix every drift found:
  - Grep for hex values in `client/src/components/**` — there should be none. Tokens only.
  - Re-verify every contrast pair in `DESIGN.md` §2.6 against what actually shipped.
  - Screenshot each list view in greyscale to confirm no status or priority is communicated by color alone (§8).
  - Walk the §9 mobile production checklist item by item.
  - Confirm the §3.3 copy rules held — no "failed", no accusatory wording, no raw API messages surfacing to the user.
- Run `npx impeccable` across the finished client and resolve every finding — this is the final gate, not a survey.
- UX refinement pass: fix any rough edges found across Phases 9–15 (inconsistent spacing, unclear states, awkward transitions) — keep changes scoped to polish, not new features.
- Basic performance review: check for obviously wasteful re-renders or unnecessary network calls introduced in earlier phases; fix low-risk, high-value issues. Confirm no animation touches `height`/`top`/`left`/`width` (`DESIGN.md` §5).
- Accessibility review against `DESIGN.md` §8 end to end: semantic HTML, form labels, focus rings, sheet focus traps and focus return, `aria-live` announcements, card accessible names, and the reduced-motion path verified with the OS setting enabled — fix straightforward issues; flag harder ones for the user rather than over-engineering a fix.

## Out of scope
- No new features (this phase closes out 0–16, it doesn't extend the roadmap).
- No Phase 17+ work (Projects, Subtasks, Time Tracking, etc.) — those remain future/out of scope per `PHASES.md` until separately scoped and approved.

## Files/areas to create or change
- `client/src/**/__tests__/*` or colocated `*.test.jsx` files for the components/flows listed above.
- `client/vitest.config.js` (or shared config if reusable from root) + React Testing Library setup.
- Various small polish edits across `client/src/**` as surfaced by the UX/performance/accessibility review — keep each change traceable to a specific, real issue found, not speculative refactors.

## Acceptance criteria
- [ ] Frontend test suite runs via a documented script (e.g. `npm test` inside `client/`) and passes.
- [ ] Component tests cover the key building blocks listed above.
- [ ] Integration-style tests cover the core task workflows against a mocked API.
- [ ] Auth-flow tests confirm protected-route behavior in both authenticated and unauthenticated states.
- [ ] Mobile viewport behavior verified across all major views (dashboard, task lists, task detail, forms, insights), including safe areas and 200% text scaling.
- [ ] Full `client/DESIGN.md` audit completed: zero hex values in components, every §2.6 contrast pair re-verified, greyscale legibility confirmed, §9 checklist walked, §3.3 copy rules held.
- [ ] `npx impeccable` reports no outstanding findings across the finished client.
- [ ] UX polish issues found during review are fixed and documented briefly in `STATE.md`'s Decisions log.
- [ ] Accessibility review against `DESIGN.md` §8 completed; straightforward issues fixed, harder ones flagged to the user.
- [ ] `STATE.md` updated: Phase 16 marked `Done`. Overall status updated to reflect that the initial 0–16 roadmap is complete, and that any further work requires scoping a new phase (17+) per `PHASES.md` with the same approval-gated process.
