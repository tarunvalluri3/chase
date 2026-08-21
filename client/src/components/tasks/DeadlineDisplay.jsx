import { formatDeadline } from '../../lib/datetime';

// DESIGN.md §7 — relative under 48h, absolute beyond; mono, tabular-nums
// (global rule in globals.css). Overdue deadlines pick up the review color
// as a visual cue, but the word ("ago"/"in") always carries the meaning.
export function DeadlineDisplay({ deadline, className = '' }) {
  const isOverdue = new Date(deadline).getTime() < Date.now();
  return (
    <time
      dateTime={deadline}
      className={`font-tabular text-meta ${className}`}
      style={{ color: isOverdue ? 'var(--color-review)' : 'var(--color-ink-3)' }}
    >
      {formatDeadline(deadline)}
    </time>
  );
}
