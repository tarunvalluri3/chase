import { useCallback, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { tasksApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';
import { useToast } from '../lib/toastStore';
import { lifecycleErrorMessage } from '../lib/taskLifecycle';

const FLOURISH_MS = 620; // DESIGN.md §5.4 — the full completion sequence
const SOBER_MS = 200; // §5.4 — delete/incomplete: card just fades
const REDUCED_MS = 120; // §5.6 — reduced motion collapses everything to this

// Shared complete/delete/resolve-missed logic for TaskCard and TaskDetail
// (DESIGN.md §9 optimistic updates + §5.4 animation-records-the-verdict).
// `onStart({ flourish })` fires immediately so the caller can kick off its
// own visual sequence; the network call and the animation's minimum
// duration run concurrently, and whichever finishes last gates the outcome
// callback — so a fast network response never truncates the flourish, and
// a slow one never leaves the UI dangling mid-animation. `onSettle(task)`
// fires only after a real server confirmation; `onRollback()` fires if the
// server rejected the action, so the caller can restore its pre-action
// visual state before the error toast lands.
export function useTaskLifecycle(task, { onStart, onSettle, onRollback } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const { refreshTasks } = useTasksContext();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();

  const run = useCallback(
    async (apiCall, { flourish, successMessage }) => {
      setSubmitting(true);
      onStart?.({ flourish });

      const delay = reducedMotion ? REDUCED_MS : flourish ? FLOURISH_MS : SOBER_MS;
      const delayPromise = new Promise((resolve) => setTimeout(resolve, delay));
      const outcome = await apiCall().then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
      );
      await delayPromise;

      setSubmitting(false);
      if (outcome.ok) {
        onSettle?.(outcome.value);
        refreshTasks();
        showToast(successMessage);
      } else {
        onRollback?.();
        showToast(lifecycleErrorMessage(outcome.error));
      }
      return outcome.ok;
    },
    [onStart, onSettle, onRollback, reducedMotion, refreshTasks, showToast],
  );

  const completeTask = useCallback(
    () => run(() => tasksApi.complete(task.id), { flourish: true, successMessage: 'Completed' }),
    [run, task.id],
  );

  const deleteTask = useCallback(
    (reason) => run(() => tasksApi.remove(task.id, reason), { flourish: false, successMessage: 'Deleted' }),
    [run, task.id],
  );

  const resolveTask = useCallback(
    (body) =>
      run(() => tasksApi.resolveMissed(task.id, body), {
        flourish: body.resolution === 'COMPLETED',
        successMessage: body.resolution === 'COMPLETED' ? 'Completed' : 'Confirmed not done',
      }),
    [run, task.id],
  );

  return { submitting, completeTask, deleteTask, resolveTask };
}
