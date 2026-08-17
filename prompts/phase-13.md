# Phase 13 — Task Lifecycle UI

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 13"). On completion, update `STATE.md` and stop — do not proceed to Phase 14 without separate approval.

## Goal
Build the UI for task lifecycle actions — complete, miss (with reason collection), delete (with reason collection) — with correct status display and clear confirmation flows, wired to the backend endpoints from Phase 3.

## In scope
- Add a "Complete" action on ACTIVE tasks (card and/or detail view), calling `POST /api/tasks/:id/complete`, with an appropriate confirmation (a lightweight confirm is enough — completion is low-risk and reversible in spirit even though the backend doesn't support un-completing, so make sure the user understands the action before committing... use judgment on confirmation weight).
- Add a "Mark as Missed" action on ACTIVE tasks that opens a form/modal requiring a non-empty reason before calling `POST /api/tasks/:id/miss`. The UI must not allow submission with an empty/whitespace reason (mirroring backend validation).
- Add a "Delete" action on ACTIVE tasks that opens a form/modal requiring a non-empty reason before calling `DELETE /api/tasks/:id`, with a clear confirmation given deletion (even if soft) removes the task from the active view permanently from the user's perspective.
- After each action, correctly update the UI: the task should disappear from its old section's list and (if the user navigates there) appear correctly in its new section (Completed/Missed/Deleted) with the right status, reason, and timestamps displayed.
- Ensure lifecycle actions are never rendered/usable for non-ACTIVE tasks (defense in depth alongside the backend's own enforcement).
- Handle and surface errors gracefully (e.g. attempting an action that the backend rejects due to a race condition — task was already transitioned elsewhere).

## Out of scope
- No dashboard/summary UI (Phase 14).
- No analytics (Phase 15).
- No restore/undo functionality (not supported by the backend in this version).

## Files/areas to create or change
- `client/src/components/tasks/CompleteAction.jsx` (or inline in `TaskCard`/`TaskDetail`).
- `client/src/components/tasks/MissModal.jsx` (reason-collection form).
- `client/src/components/tasks/DeleteModal.jsx` (reason-collection form).
- Update `client/src/components/tasks/TaskCard.jsx` and `TaskDetail.jsx` to wire in these actions conditionally based on status.
- Update `client/src/lib/apiClient.js` with complete/miss/delete methods if not already present.
- State/data-refresh handling (e.g. re-fetch or optimistic update) after a lifecycle action succeeds.

## Acceptance criteria
- [ ] Complete action works on ACTIVE tasks and correctly transitions/removes the task from the Active view.
- [ ] Miss action requires a non-empty reason client-side before allowing submission, and correctly transitions the task.
- [ ] Delete action requires a non-empty reason client-side before allowing submission, and correctly transitions the task (soft delete reflected as DELETED status, task remains viewable in the Deleted section).
- [ ] Missed and deleted tasks display their reason and relevant timestamps in the detail/list view.
- [ ] Lifecycle actions are not rendered or usable on non-ACTIVE tasks anywhere in the UI.
- [ ] Backend rejections (e.g. already-transitioned task) are surfaced to the user clearly, not as a silent failure or crash.
- [ ] `STATE.md` updated: Phase 13 marked `Done`, next phase noted, decisions logged (confirmation UX choices).
