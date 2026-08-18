import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ChartSkeleton } from '../components/analytics/ChartStates';
import { UnresolvedMissed } from '../components/analytics/UnresolvedMissed';
import { CompletionTrendChart } from '../components/analytics/CompletionTrendChart';
import { IncompleteTrendChart } from '../components/analytics/IncompleteTrendChart';
import { DeletedTrendChart } from '../components/analytics/DeletedTrendChart';
import { ReasonBreakdownChart } from '../components/analytics/ReasonBreakdownChart';
import { PriorityBreakdown } from '../components/analytics/PriorityBreakdown';
import { computeDeletedReasonBreakdown, computeIncompleteReasonBreakdown } from '../lib/analyticsStats';

// Real analytics (Phase 15, DESIGN.md §12) — every chart is a pure
// client-side aggregation (lib/analyticsStats.js) over the same unfiltered
// GET /api/tasks Home already fetches, reusing useDashboardTasks as-is
// rather than a second fetch hook: it already exposes real loading/error
// states (DESIGN.md §7.1), which is exactly what this view needs too.
export default function Insights() {
  const { tasks, status, reload } = useDashboardTasks();

  if (status === 'loading' && tasks.length === 0) {
    return (
      <div className="flex flex-col gap-6 pt-4 pb-4">
        <ChartSkeleton size="sm" />
        <ChartSkeleton size="lg" />
        <ChartSkeleton size="md" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Couldn't load your insights."
        description="Check your connection and try again."
        onRetry={reload}
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet."
        description="Patterns across your completed, missed, and dropped work will show up here once there's some history to read."
      />
    );
  }

  const incompleteReasons = computeIncompleteReasonBreakdown(tasks);
  const deletedReasons = computeDeletedReasonBreakdown(tasks);

  return (
    <div className="flex flex-col gap-8 pt-4 pb-4">
      <UnresolvedMissed tasks={tasks} />
      <CompletionTrendChart tasks={tasks} />
      <IncompleteTrendChart tasks={tasks} />
      <ReasonBreakdownChart
        title="Why tasks didn't get done"
        description="Your own reasons, ranked by how often you gave them."
        data={incompleteReasons}
        color="var(--color-notdone)"
        emptyMessage="No confirmed-incomplete tasks yet."
      />
      <PriorityBreakdown tasks={tasks} />
      <DeletedTrendChart tasks={tasks} />
      <ReasonBreakdownChart
        title="Why tasks were deleted"
        description="Your own reasons, ranked by how often you gave them."
        data={deletedReasons}
        color="var(--color-deleted)"
        emptyMessage="Nothing deleted yet."
      />
    </div>
  );
}
