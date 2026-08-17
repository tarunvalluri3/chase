# Phase 13 — Task Lifecycle UI

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 13"). On completion, update `STATE.md` and stop — do not proceed to Phase 14 without separate approval.

## Goal
Build the UI for task lifecycle actions — complete, delete (with reason collection), and resolving a MISSED task — with correct status display and clear confirmation flows, wired to the backend endpoints from Phases 3 and 6.

## In scope
- Add a "Complete" action on ACTIVE tasks (card and/or detail view), calling `POST /api/tasks/:id/complete`, with an appropriate confirmation (a lightweight confirm is enough — completion is low-risk and reversible in spirit even though the backend doesn't support un-completing, so make sure the user understands the action before committing... use judgment on confirmation weight).
- Add a "Delete" action on ACTIVE tasks that opens a form/modal requiring a non-empty reason before calling `DELETE /api/tasks/:id`, with a clear confirmation given deletion (even if soft) removes the task from the active view permanently from the user's perspective.
- There is no "Mark as Missed" action anywhere in the UI — MISSED only ever arises automatically when a task's deadline passes (Phase 6). Do not build a manual missed-marking flow; there is no backend endpoint for it.
- Add a "Resolve" flow on MISSED tasks (card and/or detail view) that presents the two outcomes clearly — e.g. "I never completed this" vs. "I actually completed this":
  - Choosing "I never completed this" opens a form requiring a non-empty reason (mirroring the Delete flow's reason UX) before calling `POST /api/tasks/:id/resolve-missed` with `{ "resolution": "INCOMPLETE", "reason": "..." }`. The UI must not allow submission with an empty/whitespace reason.
  - Choosing "I actually completed this" needs no reason — calls `POST /api/tasks/:id/resolve-missed` with `{ "resolution": "COMPLETED" }` directly (a lightweight confirm is enough, no text input).
  - Make the framing honest: MISSED means "the deadline passed without confirmation," not "you failed to do this," so the UI copy should invite the user to set the record straight rather than assume the worst.
- After each action, correctly update the UI: the task should disappear from its old section's list and (if the user navigates there) appear correctly in its new section (Completed/Missed/Incomplete/Deleted) with the right status, reason, and timestamps displayed. A MISSED task resolved as COMPLETED should move into the Completed section; one resolved as INCOMPLETE moves into the separate Incomplete section (not Missed) and can no longer be acted on.
- Ensure lifecycle actions are never rendered/usable for the wrong status (defense in depth alongside the backend's own enforcement): Complete/Delete only on ACTIVE; Resolve only on MISSED; nothing on COMPLETED/INCOMPLETE/DELETED.
- Handle and surface errors gracefully (e.g. attempting an action that the backend rejects due to a race condition — task was already transitioned elsewhere).

## Out of scope
- No dashboard/summary UI (Phase 14).
- No analytics (Phase 15).
- No restore/undo functionality (not supported by the backend in this version) — resolving a MISSED task is one-way in both directions.

## Files/areas to create or change
- `client/src/components/tasks/CompleteAction.jsx` (or inline in `TaskCard`/`TaskDetail`).
- `client/src/components/tasks/ResolveMissedModal.jsx` (INCOMPLETE vs. COMPLETED resolution UI).
- `client/src/components/tasks/DeleteModal.jsx` (reason-collection form).
- Update `client/src/components/tasks/TaskCard.jsx` and `TaskDetail.jsx` to wire in these actions conditionally based on status.
- Update `client/src/lib/apiClient.js` with complete/resolveMissed/delete methods if not already present.
- State/data-refresh handling (e.g. re-fetch or optimistic update) after a lifecycle action succeeds.

## Acceptance criteria
- [ ] Complete action works on ACTIVE tasks and correctly transitions/removes the task from the Active view.
- [ ] Delete action requires a non-empty reason client-side before allowing submission, and correctly transitions the task (soft delete reflected as DELETED status, task remains viewable in the Deleted section).
- [ ] Resolve action is only available on MISSED tasks, offers both outcomes, requires a non-empty reason client-side for `INCOMPLETE` (none for `COMPLETED`), and correctly transitions the task (moves to Incomplete with `incomplete_reason`/`incomplete_at` set, or moves to Completed with `completed_at` set) based on the chosen outcome.
- [ ] There is no "mark as missed" action anywhere in the UI.
- [ ] Missed, Incomplete, and Deleted tasks each display their relevant reason(s) and timestamps in the detail/list view; a task resolved MISSED→COMPLETED still shows its missed history alongside its completion; an Incomplete task shows both the original auto-generated missed reason and the user's own incomplete reason.
- [ ] Lifecycle actions are not rendered or usable on the wrong status anywhere in the UI.
- [ ] Backend rejections (e.g. already-resolved task) are surfaced to the user clearly, not as a silent failure or crash.
- [ ] `STATE.md` updated: Phase 13 marked `Done`, next phase noted, decisions logged (confirmation UX choices).
