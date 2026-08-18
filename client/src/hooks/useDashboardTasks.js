import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';

// Unfiltered GET /api/tasks for the dashboard (Phase 14) — one fetch,
// aggregated client-side into counts/recent-activity/due-soon (see
// lib/taskStats.js), per the phase's explicit "no new backend aggregation
// endpoint" scope. Distinct from useTaskCounts (which swallows fetch errors
// since its counts are decorative chrome): the dashboard surfaces its own
// loading/empty/error/loaded states per DESIGN.md §7.1, so this hook
// exposes them for real rather than hiding failures.
export function useDashboardTasks() {
  const { version } = useTasksContext();
  const [state, setState] = useState({ status: 'loading', tasks: [] });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const tasks = await tasksApi.list();
      setState({ status: 'loaded', tasks });
    } catch (error) {
      setState({ status: 'error', tasks: [], error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  return { tasks: state.tasks, status: state.status, error: state.error, reload: load };
}
