import { Pause, Play, Square } from 'lucide-react';
import { useWorkSession } from '../../hooks/useWorkSession';
import { formatDuration } from '../../lib/datetime';
import { Button } from '../ui/Button';

// Start/Pause/Resume/Stop work-session controls (Phase 19). `compact`
// (TaskCard) renders icon-only buttons + a live mono timer inline; the full
// variant (TaskDetail) adds a "Time tracked" label and text on each button.
// `readOnly` (a terminal-status task on TaskDetail) shows the total time
// only, no buttons -- session actions are rejected server-side once a task
// leaves ACTIVE, so the controls themselves only ever render while ACTIVE,
// matching every other lifecycle action's ACTIVE-only gating. Renders
// nothing at all once loaded if there's no history and no controls to show.
export function TimeTracker({ taskId, compact = false, readOnly = false }) {
  const { loaded, submitting, totalSeconds, isRunning, isPaused, start, pause, resume, stop } =
    useWorkSession(taskId);

  if (!loaded) return null;

  const hasElapsed = isRunning || isPaused || totalSeconds > 0;
  if (readOnly && !hasElapsed) return null;

  const iconSize = compact ? 18 : 20;
  const buttonSize = compact ? 'sm' : 'md';

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4'}`}>
      {!compact && <span className="shrink-0 text-micro text-ink-3 uppercase whitespace-nowrap">Time tracked</span>}

      {hasElapsed && (
        <span
          className={`font-tabular ${compact ? 'text-meta' : 'text-task'}`}
          style={{ color: isRunning ? 'var(--color-active)' : 'var(--color-ink-2)' }}
          aria-live={isRunning ? 'off' : undefined}
        >
          {formatDuration(totalSeconds)}
        </span>
      )}

      <div className="ml-auto flex gap-2">
        {!readOnly && !isRunning && !isPaused && (
          <Button
            type="button"
            size={buttonSize}
            variant="secondary"
            disabled={submitting}
            aria-label={compact ? 'Start work session' : undefined}
            onClick={start}
          >
            <Play size={iconSize} strokeWidth={1.8} aria-hidden="true" />
            {!compact && 'Start'}
          </Button>
        )}
        {!readOnly && isPaused && (
          <Button
            type="button"
            size={buttonSize}
            variant="secondary"
            disabled={submitting}
            aria-label={compact ? 'Resume work session' : undefined}
            onClick={resume}
          >
            <Play size={iconSize} strokeWidth={1.8} aria-hidden="true" />
            {!compact && 'Resume'}
          </Button>
        )}
        {!readOnly && isRunning && (
          <>
            <Button
              type="button"
              size={buttonSize}
              variant="secondary"
              disabled={submitting}
              aria-label={compact ? 'Pause work session' : undefined}
              onClick={pause}
            >
              <Pause size={iconSize} strokeWidth={1.8} aria-hidden="true" />
              {!compact && 'Pause'}
            </Button>
            <Button
              type="button"
              size={buttonSize}
              variant="ghost"
              disabled={submitting}
              aria-label={compact ? 'Stop work session' : undefined}
              onClick={stop}
            >
              <Square size={iconSize} strokeWidth={1.8} aria-hidden="true" />
              {!compact && 'Stop'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
