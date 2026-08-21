import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PriorityLabel } from './PriorityLabel';
import { priorityText } from './priorityConfig';
import { StatusChip, statusLabel } from './StatusChip';
import { DeadlineDisplay } from './DeadlineDisplay';
import { formatDeadline } from '../../lib/datetime';
import { Button } from '../ui/Button';
import { CompleteConfirmSheet } from './CompleteAction';
import { DeleteSheet } from './DeleteSheet';
import { ResolveSheet } from './ResolveSheet';
import { TimeTracker } from './TimeTracker';
import { useTaskLifecycle } from '../../hooks/useTaskLifecycle';

// DESIGN.md §7/§7.3/§8 — two-line title + meta row + conditional action
// row. `onSettled(taskId)` lets the parent TaskList remove this card from
// its local array once a lifecycle action actually settles (see
// useTaskLifecycle).
export function TaskCard({ task, sectionStatus, onSettled }) {
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const completeButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const resolveButtonRef = useRef(null);

  const { submitting, completeTask, deleteTask, resolveTask } = useTaskLifecycle(task, {
    onSettle: () => onSettled?.(task.id),
  });

  async function handleCompleteConfirm() {
    setCompleteOpen(false);
    await completeTask();
  }

  async function handleDeleteConfirm(reason) {
    setDeleteOpen(false);
    await deleteTask(reason);
  }

  async function handleResolveConfirm(body) {
    setResolveOpen(false);
    await resolveTask(body);
  }

  const accessibleName = `${task.title}, ${priorityText(task.priority).toLowerCase()} priority, due ${formatDeadline(
    task.deadline,
  )}, ${statusLabel(task.status).toLowerCase()}`;

  return (
    <article aria-label={accessibleName}>
      <span aria-hidden="true">
        {task.status === 'COMPLETED' && <Check />}
      </span>
      <div>
        <Link to={`/tasks/${sectionStatus}/${task.id}`}>
          <div>
            <h3>{task.title}</h3>
            <StatusChip status={task.status} />
          </div>
          <div>
            <PriorityLabel priority={task.priority} />
            <DeadlineDisplay deadline={task.deadline} />
          </div>
        </Link>

        {task.status === 'ACTIVE' && <TimeTracker taskId={task.id} compact />}

        {task.status === 'ACTIVE' && (
          <div>
            <Button
              ref={completeButtonRef}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setCompleteOpen(true)}
            >
              Complete
            </Button>
            <Button
              ref={deleteButtonRef}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}

        {task.status === 'MISSED' && (
          <div>
            <Button ref={resolveButtonRef} type="button" size="sm" onClick={() => setResolveOpen(true)}>
              Resolve
            </Button>
          </div>
        )}
      </div>

      <CompleteConfirmSheet
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleCompleteConfirm}
        returnFocusRef={completeButtonRef}
        submitting={submitting}
      />
      <DeleteSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        returnFocusRef={deleteButtonRef}
        submitting={submitting}
      />
      <ResolveSheet
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onResolve={handleResolveConfirm}
        returnFocusRef={resolveButtonRef}
        submitting={submitting}
      />
    </article>
  );
}
