# Phase 12 — Task Management UI

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 12"). On completion, update `STATE.md` and stop — do not proceed to Phase 13 without separate approval.

## Goal
Build the real task management UI: creating tasks, listing them per section (Active/Completed/Missed/Deleted from Phase 11), task cards/items, a task detail view, editing, and proper deadline/priority display — including loading, empty, and error states. Lifecycle actions (complete/miss/delete) are Phase 13; this phase is about viewing and editing.

## In scope
- Build a task creation form (title required, description optional, deadline required with a sensible date/time input, priority required as LOW/MEDIUM/HIGH selector) that calls `POST /api/tasks` via the API client.
- Build task list views for each section (Active/Completed/Missed/Deleted), fetching from `GET /api/tasks?status=...` and rendering task cards/items.
- Build a task detail view (`GET /api/tasks/:id`) showing full task info.
- Build an edit flow for ACTIVE tasks only (title/description/deadline/priority), calling `PATCH /api/tasks/:id`. The edit UI must not be reachable/usable for non-ACTIVE tasks.
- Display deadline and priority clearly and consistently across list and detail views (e.g. priority as a color-coded badge, deadline formatted in local time for the user while the API deals in UTC).
- Implement loading states (skeletons or spinners), empty states (e.g. "No active tasks yet"), and error states (e.g. failed fetch) for every list/detail view.
- Use 21st.dev MCP to source/build polished components where it speeds up building cards, forms, badges, etc., consistent with mobile-first design.

## Out of scope
- No complete/miss/delete action UI (Phase 13) — though it's fine if the detail/card components leave visual room for these actions to be added next phase.
- No dashboard/summary views (Phase 14).
- No analytics (Phase 15).

## Files/areas to create or change
- `client/src/components/tasks/TaskForm.jsx` (create + edit, shared where sensible).
- `client/src/components/tasks/TaskCard.jsx` / `TaskListItem.jsx`.
- `client/src/components/tasks/TaskDetail.jsx`.
- `client/src/components/tasks/PriorityBadge.jsx`, `DeadlineDisplay.jsx` (or similar small presentational components).
- `client/src/routes/tasks/*` — wire real data fetching into the placeholder pages from Phase 11.
- `client/src/lib/apiClient.js` — extend with task-specific methods (create/list/get/patch) if not already present.

## Acceptance criteria
- [ ] Users can create a task with all required/optional fields, validated client-side before submission (though the server remains the source of truth).
- [ ] Each section (Active/Completed/Missed/Deleted) correctly lists only tasks of that status for the authenticated user.
- [ ] Task detail view shows full task info correctly.
- [ ] Editing works only for ACTIVE tasks, correctly restricted to the four editable fields, and reflects updates immediately after save.
- [ ] Priority and deadline are displayed clearly and consistently everywhere a task appears.
- [ ] Loading, empty, and error states are implemented for every list and detail view.
- [ ] UI is usable and visually coherent on a mobile viewport.
- [ ] `STATE.md` updated: Phase 12 marked `Done`, next phase noted, decisions logged (date/time input approach, component sourcing notes).
