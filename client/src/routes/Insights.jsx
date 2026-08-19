import { useAnalyticsSummary } from '../hooks/useAnalyticsSummary';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ChartSkeleton } from '../components/analytics/ChartStates';
import { KpiRow } from '../components/analytics/KpiRow';
import { DateRangeFilter } from '../components/analytics/DateRangeFilter';
import { UnresolvedMissed } from '../components/analytics/UnresolvedMissed';
import { StatusComparisonChart } from '../components/analytics/StatusComparisonChart';
import { CompletionTrendChart } from '../components/analytics/CompletionTrendChart';
import { MissedTrendChart } from '../components/analytics/MissedTrendChart';
import { IncompleteTrendChart } from '../components/analytics/IncompleteTrendChart';
import { DeletedTrendChart } from '../components/analytics/DeletedTrendChart';
import { PriorityBreakdown } from '../components/analytics/PriorityBreakdown';
import { DeadlinePerformanceChart } from '../components/analytics/DeadlinePerformanceChart';
import { ReasonBreakdownChart } from '../components/analytics/ReasonBreakdownChart';
import { TimeTrackedTrendChart } from '../components/analytics/TimeTrackedTrendChart';
import { TimePerTaskTable } from '../components/analytics/TimePerTaskTable';
import { TimeVsOutcomeChart } from '../components/analytics/TimeVsOutcomeChart';
import { PriorityTimeChart } from '../components/analytics/PriorityTimeChart';

// Productivity Analytics 2.0 (Phase 20) — server-aggregated (GET
// /api/analytics/summary?range=), replacing Phase 15's client-side
// aggregation over an unfiltered task fetch. Section order follows
// PHASE_20.md §8: KPI row and "needs attention" first, task-outcome
// analytics next, time-tracking analytics last.
export default function Insights() {
  const { data, status, range, setRange, reload } = useAnalyticsSummary();

  if (status === 'loading' && !data) {
    return (
      <div className="flex flex-col gap-6 pt-4 pb-4">
        <ChartSkeleton size="sm" />
        <ChartSkeleton size="lg" />
        <ChartSkeleton size="md" />
      </div>
    );
  }

  if (status === 'error' && !data) {
    return (
      <ErrorState
        title="Couldn't load your insights."
        description="Check your connection and try again."
        onRetry={reload}
      />
    );
  }

  const isEmpty = data.kpis.totalTasks === 0 && data.unresolvedMissed.length === 0 && data.kpis.totalTrackedSeconds === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-6 pt-4 pb-4">
        <DateRangeFilter range={range} onChange={setRange} />
        <EmptyState
          title="Nothing to show yet."
          description="Patterns across your completed, missed, and dropped work — and the time you track against them — will show up here once there's some history to read."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-4 pb-4">
      <DateRangeFilter range={range} onChange={setRange} />
      <KpiRow kpis={data.kpis} />
      <UnresolvedMissed missed={data.unresolvedMissed} />
      <StatusComparisonChart kpis={data.kpis} />
      <CompletionTrendChart data={data.completionTrend} />
      <MissedTrendChart data={data.missedTrend} />
      <IncompleteTrendChart data={data.incompleteTrend} />
      <DeletedTrendChart data={data.deletedTrend} />
      <PriorityBreakdown breakdown={data.priorityBreakdown} />
      <DeadlinePerformanceChart data={data.deadlinePerformance} />
      <ReasonBreakdownChart
        title="Why tasks didn't get done"
        description="Your own reasons, ranked by how often you gave them."
        data={data.incompleteReasons}
        color="var(--color-notdone)"
        emptyMessage="No confirmed-incomplete tasks yet."
      />
      <ReasonBreakdownChart
        title="Why tasks were deleted"
        description="Your own reasons, ranked by how often you gave them."
        data={data.deletedReasons}
        color="var(--color-deleted)"
        emptyMessage="Nothing deleted yet."
      />
      <TimeTrackedTrendChart data={data.timeTrackedTrend} />
      <TimePerTaskTable data={data.timePerTask} />
      <TimeVsOutcomeChart data={data.timeVsOutcome} />
      <PriorityTimeChart data={data.priorityTimeSpent} />
    </div>
  );
}
