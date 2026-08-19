import { useUser } from '@clerk/clerk-react';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { useTasksContext } from '../lib/tasksStore';
import { StatusCounts } from '../components/dashboard/StatusCounts';
import { DueSoon } from '../components/dashboard/DueSoon';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { DashboardStatSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { NotificationsBanner } from '../components/notifications/NotificationsBanner';

// Real dashboard (Phase 14, DESIGN.md §7/§3.1/§14) — task-status counts, a
// due-soon heads-up, and recent activity, all aggregated client-side from
// one unfiltered GET /api/tasks via useDashboardTasks (no new backend
// aggregation endpoint, per the phase's explicit scope). Implements all
// four DESIGN.md §7.1 states: loading (stat-grid skeleton), empty (no tasks
// at all yet), error (plain explanation + Retry), loaded.
export default function Home() {
  const { user } = useUser();
  const { tasks, status, reload } = useDashboardTasks();
  const { openCreateSheet } = useTasksContext();

  const greetingName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? 'there';

  if (status === 'loading' && tasks.length === 0) {
    return (
      <div className="flex flex-col gap-8 pt-4">
        <p className="px-gutter text-body text-ink-2">Welcome back, {greetingName}.</p>
        <DashboardStatSkeleton />
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState onRetry={reload} />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet."
        description="Add your first task to see your dashboard come together."
        action={
          <Button size="sm" className="mt-1" onClick={openCreateSheet}>
            New task
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-4 pb-4">
      <p className="px-gutter text-body text-ink-2">Welcome back, {greetingName}.</p>
      <NotificationsBanner />
      <StatusCounts tasks={tasks} />
      <DueSoon tasks={tasks} />
      <RecentActivity tasks={tasks} />
    </div>
  );
}
