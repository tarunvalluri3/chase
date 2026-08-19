import { useCallback, useEffect, useState } from 'react';
import { analyticsApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';

const DEFAULT_RANGE = 'all';

// Phase 20 — one server-aggregated fetch per date range, replacing Phase
// 15's client-side aggregation over useDashboardTasks. Refetches whenever
// `range` changes or TasksProvider's `version` bumps (a task action
// elsewhere in the app — complete/delete/resolve — should be reflected here
// without a manual refresh), matching useDashboardTasks' own convention.
export function useAnalyticsSummary() {
  const { version } = useTasksContext();
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [state, setState] = useState({ status: 'loading', data: null });

  const load = useCallback(async (currentRange) => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const data = await analyticsApi.summary(currentRange);
      setState({ status: 'loaded', data });
    } catch (error) {
      setState({ status: 'error', data: null, error });
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range, version]);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    range,
    setRange,
    reload: () => load(range),
  };
}
