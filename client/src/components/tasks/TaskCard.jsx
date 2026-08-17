import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { PriorityRail } from './PriorityRail';
import { PriorityLabel } from './PriorityLabel';
import { priorityText } from './priorityConfig';
import { StatusChip, statusLabel } from './StatusChip';
import { DeadlineDisplay } from './DeadlineDisplay';
import { formatDeadline } from '../../lib/datetime';
import { Button } from '../ui/Button';
import { CompleteConfirmSheet } from './CompleteAction';
import { DeleteSheet } from './DeleteSheet';
import { ResolveSheet } from './ResolveSheet';
import { useTaskLifecycle } from '../../hooks/useTaskLifecycle';
import { EASE_EXIT, EASE_OUT } from '../../lib/motion';

// DESIGN.md §7/§7.3/§8 — priority rail + two-line title + meta row +
// conditional action row. `onSettled(taskId)`/`onRollback()` let the
// parent TaskList remove/restore this card from its local array once a
// lifecycle action actually settles (see useTaskLifecycle).
export function TaskCard({ task, sectionStatus, onSettled }) {
  const [stage, setStage] = useState('idle'); // idle | press | wash | check | exit | fade
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const completeButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const resolveButtonRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const { submitting, completeTask, deleteTask, resolveTask } = useTaskLifecycle(task, {
    onStart: ({ flourish }) => playFlourish(flourish),
    onSettle: () => onSettled?.(task.id),
    onRollback: () => setStage('idle'),
  });

  function playFlourish(flourish) {
    if (reducedMotion) {
      setStage('fade');
      return;
    }
    if (!flourish) {
      setStage('fade');
      return;
    }
    if (navigator.vibrate) navigator.vibrate(10);
    setStage('press');
    setTimeout(() => setStage('wash'), 90);
    setTimeout(() => setStage('check'), 200);
    setTimeout(() => setStage('exit'), 380);
  }

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

  const isExiting = stage === 'exit' || stage === 'fade';
  const isPressed = stage === 'press' || stage === 'wash' || stage === 'check' || stage === 'exit';
  const showWash = stage === 'wash' || stage === 'check' || stage === 'exit';
  const showCheck = stage === 'check' || stage === 'exit';

  return (
    <motion.article
      layout
      aria-label={accessibleName}
      className="relative flex gap-3 overflow-hidden rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4"
      animate={{ opacity: isExiting ? 0 : 1, scale: isPressed ? 0.97 : 1 }}
      transition={{
        duration: isExiting ? (reducedMotion ? 0.12 : stage === 'exit' ? 0.24 : 0.2) : 0.09,
        ease: isExiting ? EASE_EXIT : EASE_OUT,
      }}
    >
      {showWash && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            transformOrigin: 'left',
            background: 'color-mix(in srgb, var(--color-completed) 22%, var(--color-surface))',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        />
      )}
      {showCheck && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 12.5L10 17.5L19 7"
              stroke="var(--color-completed)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
            />
          </svg>
        </div>
      )}

      <PriorityRail priority={task.priority} className="relative" />
      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
        <Link to={`/tasks/${sectionStatus}/${task.id}`} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-task text-ink">{task.title}</h3>
            <StatusChip status={task.status} className="shrink-0" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <PriorityLabel priority={task.priority} />
            <DeadlineDisplay deadline={task.deadline} />
          </div>
        </Link>

        {task.status === 'ACTIVE' && (
          <div className="flex gap-2 pt-1">
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
          <div className="flex gap-2 pt-1">
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
    </motion.article>
  );
}
