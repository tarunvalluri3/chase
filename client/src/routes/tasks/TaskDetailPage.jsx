import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tasksApi } from '../../lib/apiClient';
import { TaskDetail } from '../../components/tasks/TaskDetail';
import { TaskDetailSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

// GET /api/tasks/:id — the shared detail route behind every status section
// (/tasks/:status/:id). `:status` in the URL is only used for the back
// link/AppBar context; the task's own `status` field is what drives the
// actual detail content.
export default function TaskDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', task: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const task = await tasksApi.get(id);
      setState({ status: 'loaded', task });
    } catch (error) {
      setState({ status: 'error', task: null, error });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') return <TaskDetailSkeleton />;

  if (state.status === 'error') {
    return (
      <ErrorState title="Couldn't load this task." description="Check your connection and try again." onRetry={load} />
    );
  }

  return (
    <TaskDetail task={state.task} onTaskUpdated={(updated) => setState({ status: 'loaded', task: updated })} />
  );
}
