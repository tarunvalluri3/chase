import { useRef, useState } from 'react';
import { PriorityLabel } from './PriorityLabel';
import { StatusChip } from './StatusChip';
import { formatTimestamp } from '../../lib/datetime';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { TaskForm } from './TaskForm';
import { CompleteConfirmSheet } from './CompleteAction';
import { DeleteSheet } from './DeleteSheet';
import { ResolveSheet } from './ResolveSheet';
import { TimeTracker } from './TimeTracker';
import { useTasksContext } from '../../lib/tasksStore';
import { useTaskLifecycle } from '../../hooks/useTaskLifecycle';
import { repeatText } from './repeatConfig';
import { Bell, Repeat } from 'lucide-react';

// Full task info (DESIGN.md §7.3) — a MISSED task also shows its
// auto-generated missed_reason, and an INCOMPLETE task shows both
// missed_reason and incomplete_reason side by side (distinct records, both
// preserved per CLAUDE.md's data model). Reasons are never truncated here.
// Lifecycle actions render per §7.3: Complete/Edit/Delete only on ACTIVE,
// Resolve only on MISSED, nothing on COMPLETED/INCOMPLETE/DELETED. Unlike
// TaskCard, the detail view has no list to close a gap in, so a settled
// action just swaps in the server's updated task rather than animating an
// exit — the same useTaskLifecycle hook, a lighter caller.
export function TaskDetail({ task, onTaskUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const editButtonRef = useRef(null);
  const completeButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const resolveButtonRef = useRef(null);
  const { refreshTasks } = useTasksContext();

  const { submitting, completeTask, deleteTask, resolveTask } = useTaskLifecycle(task, {
    onSettle: (updated) => onTaskUpdated?.(updated),
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

  return (
    <div className="flex flex-col gap-6 px-gutter pt-2 pb-10">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-title text-ink">{task.title}</h2>
        <StatusChip status={task.status} className="shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <PriorityLabel priority={task.priority} />
        <span className="font-tabular text-meta text-ink-3">Due {formatTimestamp(task.deadline)}</span>
        {task.reminder_enabled && (
          <span className="flex items-center gap-1 text-meta text-ink-3">
            <Bell size={14} strokeWidth={1.8} aria-hidden="true" />
            Reminder on
          </span>
        )}
        {task.repeat_rule && task.repeat_rule !== 'NONE' && (
          <span className="flex items-center gap-1 text-meta text-ink-3">
            <Repeat size={14} strokeWidth={1.8} aria-hidden="true" />
            {repeatText(task.repeat_rule)}
          </span>
        )}
      </div>

      {task.description && <p className="whitespace-pre-wrap text-body text-ink-2">{task.description}</p>}

      <dl className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4 text-meta text-ink-3">
        <Row label="Created" value={formatTimestamp(task.created_at)} />
        {task.completed_at && <Row label="Completed" value={formatTimestamp(task.completed_at)} />}
        {task.missed_at && <Row label="Flagged needs review" value={formatTimestamp(task.missed_at)} />}
        {task.incomplete_at && <Row label="Confirmed not done" value={formatTimestamp(task.incomplete_at)} />}
        {task.deleted_at && <Row label="Deleted" value={formatTimestamp(task.deleted_at)} />}
      </dl>

      <TimeTracker taskId={task.id} readOnly={task.status !== 'ACTIVE'} />

      {task.missed_reason && <Reason label="Why it needed review" text={task.missed_reason} />}
      {task.incomplete_reason && <Reason label="What got in the way" text={task.incomplete_reason} />}
      {task.deletion_reason && <Reason label="Why it was deleted" text={task.deletion_reason} />}

      {task.status === 'ACTIVE' && (
        <div className="flex gap-3">
          <Button ref={completeButtonRef} className="flex-1" onClick={() => setCompleteOpen(true)}>
            Complete
          </Button>
          <Button ref={editButtonRef} variant="secondary" className="flex-1" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button ref={deleteButtonRef} variant="ghost" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      {task.status === 'MISSED' && (
        <Button ref={resolveButtonRef} onClick={() => setResolveOpen(true)}>
          Resolve
        </Button>
      )}

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit task"
        returnFocusRef={editButtonRef}
      >
        <TaskForm
          mode="edit"
          task={task}
          onCancel={() => setEditOpen(false)}
          onSuccess={(updated) => {
            setEditOpen(false);
            refreshTasks();
            onTaskUpdated?.(updated);
          }}
        />
      </Sheet>

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
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-tabular">{value}</dd>
    </div>
  );
}

function Reason({ label, text }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-micro text-ink-3 uppercase">{label}</p>
      <p className="whitespace-pre-wrap text-body text-ink-2">{text}</p>
    </div>
  );
}
