import { useMemo, useState } from 'react';
import { useTaskList } from '../../hooks/useTaskList';
import { useTasksContext } from '../../lib/tasksStore';
import { sortTasks } from '../../lib/taskStats';
import { PullToRefresh } from '../ui/PullToRefresh';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { TaskCardSkeletonList } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { TaskCard } from './TaskCard';

// One list view (Active/Missed/Completed/Incomplete/Deleted), fetching
// GET /api/tasks?status=... via useTaskList. Implements all four
// DESIGN.md §7.1 states plus pull-to-refresh (§9). Sort order and
// list/grid layout come from the shared TasksProvider state that
// FilterRow's sort/view controls also read and write.
export function TaskList({ status, emptyTitle, emptyDescription, showCreateAction = false }) {
  const { tasks: rawTasks, status: loadStatus, reload, removeLocal } = useTaskList(status);
  const { openCreateSheet, sortBy, viewMode } = useTasksContext();
  const [refreshing, setRefreshing] = useState(false);
  const tasks = useMemo(() => sortTasks(rawTasks, sortBy), [rawTasks, sortBy]);

  async function handlePullRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loadStatus === 'loading' && tasks.length === 0) {
    return <TaskCardSkeletonList />;
  }

  if (loadStatus === 'error') {
    return <ErrorState onRetry={reload} />;
  }

  if (tasks.length === 0) {
    return (
      <PullToRefresh onRefresh={handlePullRefresh} refreshing={refreshing}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            showCreateAction ? (
              <Button size="sm" onClick={openCreateSheet}>
                New task
              </Button>
            ) : undefined
          }
        />
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handlePullRefresh} refreshing={refreshing}>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} sectionStatus={status} onSettled={removeLocal} />
          </li>
        ))}
      </ul>
    </PullToRefresh>
  );
}
