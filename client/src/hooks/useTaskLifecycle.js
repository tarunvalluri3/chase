import { useCallback, useState } from 'react';
import { tasksApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';
import { useToast } from '../lib/toastStore';
import { lifecycleErrorMessage } from '../lib/taskLifecycle';

// Shared complete/delete/resolve-missed logic for TaskCard and TaskDetail.
// `onSettle(task)` fires only after a real server confirmation; `onRollback()`
// fires if the server rejected the action.
export function useTaskLifecycle(task, { onStart, onSettle, onRollback } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const { refreshTasks } = useTasksContext();
  const { showToast } = useToast();

  const run = useCallback(
    async (apiCall, { flourish, successMessage }) => {
      setSubmitting(true);
      onStart?.({ flourish });

      const outcome = await apiCall().then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
      );

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
    [onStart, onSettle, onRollback, refreshTasks, showToast],
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
