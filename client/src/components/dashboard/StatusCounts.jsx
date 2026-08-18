import { StatTile } from './StatTile';
import { statusLabel } from '../tasks/StatusChip';
import { computeStatusCounts, STATUS_ORDER } from '../../lib/taskStats';

// DESIGN.md §2.4 — same status colors/labels as StatusChip (MISSED reads
// "Needs review", INCOMPLETE reads "Not done"), reused here rather than
// redefined so the two can't drift.
const STATUS_COLOR = {
  ACTIVE: 'var(--color-active)',
  MISSED: 'var(--color-review)',
  COMPLETED: 'var(--color-completed)',
  INCOMPLETE: 'var(--color-notdone)',
  DELETED: 'var(--color-deleted)',
};

// 2-up grid of five StatTiles (DESIGN.md §7) — the fifth (Deleted) spans
// both columns since five tiles don't divide evenly into pairs.
export function StatusCounts({ tasks }) {
  const counts = computeStatusCounts(tasks);
  return (
    <div className="grid grid-cols-2 gap-3 px-gutter">
      {STATUS_ORDER.map((status, index) => (
        <StatTile
          key={status}
          label={statusLabel(status)}
          count={counts[status]}
          color={STATUS_COLOR[status]}
          className={index === STATUS_ORDER.length - 1 ? 'col-span-2' : ''}
        />
      ))}
    </div>
  );
}
