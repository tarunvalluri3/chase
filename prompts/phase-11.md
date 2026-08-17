# Phase 11 — Application Shell

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 11"). On completion, update `STATE.md` and stop — do not proceed to Phase 12 without separate approval.

## Goal
Build the main authenticated app layout exactly as specified in **`client/DESIGN.md` §6 (Navigation)**: the five-slot bottom navigation bar, the AppBar, the scrollable status FilterRow, and the top-level sections (Home/Active/Completed/Missed/Incomplete/Deleted) as routed placeholders. No real task data rendering yet — that's Phase 12.

> **The navigation pattern is settled, not a judgement call.** `DESIGN.md` §6 and §11 specify a five-slot bottom tab bar — Home · Tasks · Create · Insights · Profile. **There is no hamburger, no drawer, and no top-level menu anywhere in the app.** Build what §6.1 specifies rather than choosing a pattern.

Note: `Missed` and `Incomplete` are separate sections, not one — `Missed` holds tasks awaiting the user's resolution (deadline passed, not yet confirmed either way), `Incomplete` holds tasks the user has explicitly confirmed were never done (with a reason). See `CLAUDE.md`'s Lifecycle Rules for why these are distinct statuses. Per `DESIGN.md` §2.4 their UI labels are **"Needs review"** and **"Not done"** respectively, while the API statuses remain `MISSED` and `INCOMPLETE`.

## In scope
- Build the authenticated app shell: `AppBar` (`DESIGN.md` §6.2 — screen title plus a mono uppercase context line, at most one trailing action, no back chevron on tab roots), `BottomNav` (§6.1), and a content area for routed sections.
- **`BottomNav` to spec:** five slots, 56px + `env(safe-area-inset-bottom)`, backdrop blur with a solid fallback, 22px Lucide icons at 1.75px stroke, 10px labels that stay, the indigo `layoutId` pill indicator, the raised Steel Teal Create action opening a sheet rather than routing, and the amber needs-review dot badge. 48×48 minimum tap targets.
- **`FilterRow`:** horizontally scrollable status pills — Active · Needs review · Completed · Not done · Deleted — with counts, scroll-snap, and the selected pill scrolled into view on mount. Counts may be stubbed this phase; real data is Phase 12.
- Create routed placeholder sections: Home, Active, Completed, Missed, Incomplete, Deleted — each a real, deep-linkable route with a real (if mostly empty) page component, wired into the router from Phase 9/10. Per `DESIGN.md` §6 the five status routes live under `/tasks/:status` and are presented behind the single Tasks tab; **all six remain real routes** and none of Phase 11's original acceptance criteria are dropped.
- Add `/insights` and `/profile` routes. `/insights` ships as a styled, locked placeholder until Phase 15.
- Ensure the shell only renders for authenticated users (uses the protected route logic from Phase 10).
- Apply Framer Motion per `DESIGN.md` §5.5: route transitions are a cross-fade plus 8px Y at 200ms (never a horizontal slide), and the nav pill travels between tabs via `layoutId`. Nothing else animates this phase.
- Confirm the structure is correct for mobile viewports specifically (per `CLAUDE.md` and `DESIGN.md`, treat as mobile-only — there are no desktop breakpoints in v1).

## Out of scope
- No real task data fetching/rendering (Phase 12).
- No task creation/edit/lifecycle UI (Phase 12/13).
- No dashboard content (Phase 14).
- No analytics (Phase 15).

## Files/areas to create or change
- `client/src/layouts/AppLayout.jsx` (or similar) — AppBar + outlet + BottomNav.
- `client/src/components/nav/BottomNav.jsx`, `AppBar.jsx`, `FilterRow.jsx`.
- `client/src/routes/Home.jsx`, `client/src/routes/tasks/Active.jsx`, `client/src/routes/tasks/Completed.jsx`, `client/src/routes/tasks/Missed.jsx`, `client/src/routes/tasks/Incomplete.jsx`, `client/src/routes/tasks/Deleted.jsx` (placeholder content, real content in Phase 12+).
- `client/src/routes/Insights.jsx` (locked placeholder), `client/src/routes/Profile.jsx`.
- Update router config to nest these under the authenticated layout.

## Acceptance criteria
- [ ] Authenticated users see a consistent AppBar + bottom navigation across all app sections.
- [ ] The bottom nav matches `DESIGN.md` §6.1 exactly: five slots, safe-area padding, `layoutId` pill, raised Create action opening a sheet, amber needs-review dot, labels present, 48×48 tap targets.
- [ ] **There is no hamburger, drawer, or top-level menu anywhere in the app.**
- [ ] Home/Active/Completed/Missed/Incomplete/Deleted are each real, deep-linkable routes with placeholder content, plus `/insights` and `/profile`.
- [ ] Section labels follow `DESIGN.md` §2.4 — "Needs review" and "Not done", not "Missed" and "Incomplete", in user-facing chip copy.
- [ ] Navigation is usable and ergonomic on a mobile viewport (thumb-reachable nav, appropriate tap targets), and the bar clears the home indicator on a notched device.
- [ ] Shell correctly gates on authentication (unauthenticated users never see it).
- [ ] Route transitions and the nav pill match `DESIGN.md` §5.5, and the reduced-motion path is verified with the OS setting enabled.
- [ ] No hex values in any component file — tokens only.
- [ ] `npx impeccable` check passes (or every finding is fixed) before the phase is marked Done.
- [ ] `STATE.md` updated: Phase 11 marked `Done`, next phase noted, decisions logged (route shape chosen for the consolidated Tasks tab).
