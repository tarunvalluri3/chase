import { Activity, CheckCircle2, Clock, FileText, Trash2 } from 'lucide-react';
import { LedgerStrip, StatTile } from './StatTile';
import { statusLabel } from '../tasks/StatusChip';
import { computeStatusCounts, STATUS_ORDER } from '../../lib/taskStats';

// One restrained accent, not five competing hues: MISSED ("Needs review")
// is the only count that calls for attention, so it alone gets a colored
// bubble; the other four stay neutral ink-3. Labels below each tile (reused
// from StatusChip so the words can't drift) still carry the full meaning.
const STATUS_COLOR = {
  ACTIVE: 'var(--color-ink-3)',
  MISSED: 'var(--color-review)',
  COMPLETED: 'var(--color-ink-3)',
  INCOMPLETE: 'var(--color-ink-3)',
  DELETED: 'var(--color-ink-3)',
};

const STATUS_ICON = {
  ACTIVE: Activity,
  MISSED: FileText,
  COMPLETED: CheckCircle2,
  INCOMPLETE: Clock,
  DELETED: Trash2,
};

// A single stat card of five icon-bubble StatTile cells (DESIGN.md v3 §7).
export function StatusCounts({ tasks }) {
  const counts = computeStatusCounts(tasks);
  return (
    <div className="px-gutter">
      <LedgerStrip className="overflow-x-auto">
        {STATUS_ORDER.map((status) => (
          <StatTile
            key={status}
            label={statusLabel(status)}
            count={counts[status]}
            color={STATUS_COLOR[status]}
            icon={STATUS_ICON[status]}
          />
        ))}
      </LedgerStrip>
    </div>
  );
}
