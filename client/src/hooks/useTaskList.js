import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';

// Fetches one status section's tasks (GET /api/tasks?status=...), per
// DESIGN.md §7.1's four states. Re-fetches whenever the shared `version`
// signal bumps (see tasksStore.jsx), so a create/edit anywhere in the app
// is reflected the next time this list is visible.
export function useTaskList(status) {
  const { version } = useTasksContext();
  const [state, setState] = useState({ status: 'loading', tasks: [] });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const tasks = await tasksApi.list(status);
      setState({ status: 'loaded', tasks });
    } catch (error) {
      setState({ status: 'error', tasks: [], error });
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load, version]);

  // Local-only removal for a settled lifecycle action (DESIGN.md §9) — a
  // card leaves the list the moment its action is confirmed by the server,
  // without waiting for the next `version`-triggered refetch. There's no
  // matching "restore": a rejected action never removes the card in the
  // first place (see TaskCard/useTaskLifecycle — the flourish plays in
  // place and only onSettle, which fires on success, calls this).
  const removeLocal = useCallback((id) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) }));
  }, []);

  return {
    tasks: state.tasks,
    status: state.status,
    error: state.error,
    reload: load,
    removeLocal,
  };
}
