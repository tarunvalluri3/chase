import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../lib/apiClient';
import { useTasksContext } from '../lib/tasksStore';

const STATUS_TO_ROUTE_KEY = {
  ACTIVE: 'active',
  MISSED: 'missed',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
  DELETED: 'deleted',
};

const EMPTY_COUNTS = { active: 0, missed: 0, completed: 0, incomplete: 0, deleted: 0 };

// Real per-status counts for FilterRow and the BottomNav needs-review badge
// (both stubbed at zero through Phase 11). One unfiltered fetch, tallied
// client-side, rather than five separate requests per render.
export function useTaskCounts() {
  const { version } = useTasksContext();
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const load = useCallback(async () => {
    try {
      const tasks = await tasksApi.list();
      const next = { ...EMPTY_COUNTS };
      for (const task of tasks) {
        const key = STATUS_TO_ROUTE_KEY[task.status];
        if (key) next[key] += 1;
      }
      setCounts(next);
    } catch {
      // Counts are decorative chrome (badge dot, filter-pill numbers) — a
      // failed background refresh just leaves the previous counts in place
      // rather than surfacing a second error UI on top of the list's own.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  return counts;
}
