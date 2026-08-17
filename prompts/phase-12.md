# Phase 12 — Task Management UI

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 12"). On completion, update `STATE.md` and stop — do not proceed to Phase 13 without separate approval.

## Goal
Build the real task management UI: creating tasks, listing them per section (Active/Completed/Missed/Incomplete/Deleted from Phase 11), task cards/items, a task detail view, editing, and proper deadline/priority display — including loading, empty, and error states. Lifecycle actions (complete/resolve-missed/delete) are Phase 13; this phase is about viewing and editing.

> **Follow `client/DESIGN.md`.** This phase builds most of the component inventory in §7, so read §2.4–2.5 (status and priority color), §3 (type and voice), §7 (components and states), and §7.2 (empty-state copy) before starting. The empty-state and error copy in §7.2 is written — use it verbatim rather than inventing wording.

## In scope
- Build a task creation form (title required, description optional, deadline required with a sensible date/time input, priority required as LOW/MEDIUM/HIGH selector) that calls `POST /api/tasks` via the API client.
- Build task list views for each section (Active/Completed/Missed/Incomplete/Deleted), fetching from `GET /api/tasks?status=...` and rendering task cards/items.
- Build a task detail view (`GET /api/tasks/:id`) showing full task info.
- Build an edit flow for ACTIVE tasks only (title/description/deadline/priority), calling `PATCH /api/tasks/:id`. The edit UI must not be reachable/usable for non-ACTIVE tasks.
- Display deadline and priority clearly and consistently across list and detail views:
  - **Priority is monochrome** (`DESIGN.md` §2.5) — a 3px left rail on the card plus a text label, brighter for more urgent. It gets **no hue of its own**, so it never competes with status color and survives greyscale. Do not build a color-coded priority badge.
  - **Status chips** use the five variants in `DESIGN.md` §2.4, with a 14% alpha tint background. The chip for a `MISSED` task reads **"Needs review"**, and for `INCOMPLETE` reads **"Not done"** — the API statuses are unchanged.
  - **Deadlines** render via `DeadlineDisplay` (§7): relative under 48h ("in 2h", "2d overdue"), absolute beyond, mono with `tabular-nums`, UTC in and local out via `Intl.DateTimeFormat`/`Intl.RelativeTimeFormat` — no date library needed.
- Implement **all four states** for every list and detail view per `DESIGN.md` §7.1: loading (three skeleton cards at real card dimensions — **not** a centered spinner), empty (copy from §7.2, verbatim), error (plain explanation plus Retry — **never a raw API message**), and loaded.
- Add **pull-to-refresh** to every task list (`DESIGN.md` §9).
- Use 21st.dev MCP to source component *structure* where it speeds up building cards, forms, sheets, and chips. **Hard rule from `DESIGN.md` §10.4: nothing from 21st.dev ships with its own colors, radii, spacing, or type — every generated component is retokenized against `tokens.css` in the same commit it arrives in.** If a component can't be expressed in the existing tokens, stop and raise it rather than adding an ad-hoc value.
- The `Sheet` component (`DESIGN.md` §7) is built here and reused by Phase 13: drag handle, drag-to-dismiss, scrim, focus trap, keyboard-aware lift. Task creation opens through it from the bottom nav's Create action.

## Out of scope
- No complete/resolve-missed/delete action UI (Phase 13) — though it's fine if the detail/card components leave visual room for these actions to be added next phase.
- No dashboard/summary views (Phase 14).
- No analytics (Phase 15).

## Files/areas to create or change
- `client/src/components/tasks/TaskForm.jsx` (create + edit, shared where sensible).
- `client/src/components/tasks/TaskCard.jsx` / `TaskListItem.jsx`.
- `client/src/components/tasks/TaskDetail.jsx`.
- `client/src/components/tasks/PriorityRail.jsx`, `PriorityLabel.jsx`, `StatusChip.jsx`, `DeadlineDisplay.jsx` (small presentational components — note `PriorityRail`, not a color-coded badge, per `DESIGN.md` §2.5).
- `client/src/components/ui/Sheet.jsx`, `Skeleton.jsx`, `EmptyState.jsx`, `ErrorState.jsx`.
- `client/src/routes/tasks/*` — wire real data fetching into the placeholder pages from Phase 11.
- `client/src/lib/apiClient.js` — extend with task-specific methods (create/list/get/patch) if not already present.

## Acceptance criteria
- [ ] Users can create a task with all required/optional fields, validated client-side before submission (though the server remains the source of truth).
- [ ] Each section (Active/Completed/Missed/Incomplete/Deleted) correctly lists only tasks of that status for the authenticated user.
- [ ] Task detail view shows full task info correctly.
- [ ] Editing works only for ACTIVE tasks, correctly restricted to the four editable fields, and reflects updates immediately after save.
- [ ] Priority and deadline are displayed clearly and consistently everywhere a task appears, and priority is monochrome per `DESIGN.md` §2.5.
- [ ] Every status and priority is legible **without color** — verify by screenshotting a list in greyscale (`DESIGN.md` §8).
- [ ] Loading, empty, and error states are implemented for every list and detail view, with §7.2's copy used verbatim.
- [ ] Pull-to-refresh works on every task list.
- [ ] Task cards are `<article>` elements with the accessible name format in `DESIGN.md` §8.
- [ ] No hex values in any component file — tokens only. Any component sourced from 21st.dev has been fully retokenized.
- [ ] UI is usable and visually coherent on a mobile viewport, and survives 200% OS text scaling without clipping or overlap.
- [ ] `npx impeccable` check passes (or every finding is fixed) before the phase is marked Done.
- [ ] `STATE.md` updated: Phase 12 marked `Done`, next phase noted, decisions logged (date/time input approach, component sourcing notes, any token additions and why).
