import { ApiError } from './apiClient';

// DESIGN.md §3.3 error voice — what broke, then the fix, no apology, no
// error code shown to the user. Backend rejections (e.g. a task already
// transitioned elsewhere) surface this way rather than a raw API message.
export function lifecycleErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'This task was already resolved somewhere else. Pull to refresh.';
    if (error.status === 404) return "This task couldn't be found. Pull to refresh.";
  }
  return 'Something went wrong. Try again.';
}

// Same voice as lifecycleErrorMessage, worded for a work-session action
// (Start/Pause/Resume/Stop) instead of a task-status transition.
export function sessionErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'This session changed somewhere else. Refresh and try again.';
    if (error.status === 404) return "This task couldn't be found. Pull to refresh.";
  }
  return 'Something went wrong. Try again.';
}
