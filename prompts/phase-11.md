# Phase 11 — Application Shell

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 11"). On completion, update `STATE.md` and stop — do not proceed to Phase 12 without separate approval.

## Goal
Build the main authenticated app layout: navigation, header/sidebar (mobile-appropriate — likely a bottom nav or hamburger/drawer pattern given mobile-first/mobile-only scope), and the top-level sections (Home/Active/Completed/Missed/Incomplete/Deleted) as routed placeholders, with responsive structure. No real task data rendering yet — that's Phase 12.

Note: `Missed` and `Incomplete` are separate sections, not one — `Missed` holds tasks awaiting the user's resolution (deadline passed, not yet confirmed either way), `Incomplete` holds tasks the user has explicitly confirmed were never done (with a reason). See `CLAUDE.md`'s Lifecycle Rules for why these are distinct statuses.

## In scope
- Design and build the authenticated app shell: header (app name, maybe logout access), primary navigation appropriate for mobile (e.g. bottom tab bar or slide-out drawer — use judgment, favor common mobile UX patterns), and a content area for routed sections.
- Create routed placeholder sections: Home, Active, Completed, Missed, Incomplete, Deleted — each a real route with a real (if mostly empty) page component, wired into the router from Phase 9/10.
- Ensure the shell only renders for authenticated users (uses the protected route logic from Phase 10).
- Apply Framer Motion for tasteful, minimal transitions where appropriate (e.g. route/page transitions or nav interactions) — don't overdo animation.
- Confirm responsive structure is correct for mobile viewports specifically (per `CLAUDE.md`, treat as mobile-only — don't spend effort on desktop breakpoints unless the user asks).

## Out of scope
- No real task data fetching/rendering (Phase 12).
- No task creation/edit/lifecycle UI (Phase 12/13).
- No dashboard content (Phase 14).
- No analytics (Phase 15).

## Files/areas to create or change
- `client/src/layouts/AppLayout.jsx` (or similar) — header + nav + outlet.
- `client/src/components/nav/` — navigation components (tab bar / drawer).
- `client/src/routes/Home.jsx`, `client/src/routes/tasks/Active.jsx`, `client/src/routes/tasks/Completed.jsx`, `client/src/routes/tasks/Missed.jsx`, `client/src/routes/tasks/Incomplete.jsx`, `client/src/routes/tasks/Deleted.jsx` (placeholder content, real content in Phase 12+).
- Update router config to nest these under the authenticated layout.

## Acceptance criteria
- [ ] Authenticated users see a consistent header + navigation across all app sections.
- [ ] Home/Active/Completed/Missed/Incomplete/Deleted are each real, navigable routes with placeholder content.
- [ ] Navigation is usable and ergonomic on a mobile viewport (thumb-reachable nav, appropriate tap targets).
- [ ] Shell correctly gates on authentication (unauthenticated users never see it).
- [ ] Transitions (if added) are subtle and don't hinder usability.
- [ ] `STATE.md` updated: Phase 11 marked `Done`, next phase noted, decisions logged (nav pattern chosen and why).
