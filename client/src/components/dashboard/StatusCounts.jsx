import { LedgerStrip, StatTile } from './StatTile';
import { statusLabel } from '../tasks/StatusChip';
import { computeStatusCounts, STATUS_ORDER } from '../../lib/taskStats';

// DESIGN.md §2.3 — same status colors/labels as StatusChip (MISSED reads
// "Needs review", INCOMPLETE reads "Not done"), reused here rather than
// redefined so the two can't drift.
const STATUS_COLOR = {
  ACTIVE: 'var(--color-active)',
  MISSED: 'var(--color-review)',
  COMPLETED: 'var(--color-completed)',
  INCOMPLETE: 'var(--color-notdone)',
  DELETED: 'var(--color-deleted)',
};

// A single ledger strip of five StatTile cells (DESIGN.md §4.1/§7/§9) —
// replaces v1's bordered 2-up tile grid.
export function StatusCounts({ tasks }) {
  const counts = computeStatusCounts(tasks);
  return (
    <div className="px-gutter">
      <LedgerStrip className="overflow-x-auto">
        {STATUS_ORDER.map((status) => (
          <StatTile key={status} label={statusLabel(status)} count={counts[status]} color={STATUS_COLOR[status]} />
        ))}
      </LedgerStrip>
    </div>
  );
}
