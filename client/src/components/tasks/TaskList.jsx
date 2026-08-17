import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTaskList } from '../../hooks/useTaskList';
import { useTasksContext } from '../../lib/tasksStore';
import { PullToRefresh } from '../ui/PullToRefresh';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { TaskCardSkeletonList } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { TaskCard } from './TaskCard';
import { listContainerVariants, listItemVariants } from '../../lib/motion';

// One list view (Active/Missed/Completed/Incomplete/Deleted), fetching
// GET /api/tasks?status=... via useTaskList. Implements all four
// DESIGN.md §7.1 states plus pull-to-refresh (§9).
export function TaskList({ status, emptyTitle, emptyDescription, showCreateAction = false }) {
  const { tasks, status: loadStatus, reload, removeLocal } = useTaskList(status);
  const { openCreateSheet } = useTasksContext();
  const reducedMotion = useReducedMotion();
  const [refreshing, setRefreshing] = useState(false);

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
              <Button size="sm" className="mt-1" onClick={openCreateSheet}>
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
      <motion.ul
        variants={listContainerVariants(reducedMotion)}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-(--spacing-stack-gap) px-gutter pt-4 pb-4"
      >
        <AnimatePresence initial={false}>
          {tasks.map((task, index) => (
            <motion.li
              key={task.id}
              layout
              variants={listItemVariants(reducedMotion, index)}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <TaskCard task={task} sectionStatus={status} onSettled={removeLocal} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </PullToRefresh>
  );
}
