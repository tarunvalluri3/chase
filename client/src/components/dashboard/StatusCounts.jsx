import { Activity, CheckCircle2, Clock, FileText, Trash2 } from 'lucide-react';
import { LedgerStrip, StatTile } from './StatTile';
import { statusLabel } from '../tasks/StatusChip';
import { computeStatusCounts, STATUS_ORDER } from '../../lib/taskStats';

// Each status gets its own tint (DESIGN.md v3 §2.3 tokens) rather than one
// restrained accent — five distinct icon-bubble colors so the row reads at
// a glance, same tint-background/solid-icon pattern the priority pill uses.
const STATUS_STYLE = {
  ACTIVE: { bg: 'var(--color-brand-soft)', icon: 'var(--color-brand)' },
  MISSED: { bg: 'var(--color-ochre-tint)', icon: 'var(--color-ochre)' },
  COMPLETED: { bg: 'var(--color-moss-tint)', icon: 'var(--color-moss)' },
  INCOMPLETE: { bg: 'var(--color-sand-tint)', icon: 'var(--color-sand)' },
  DELETED: { bg: 'var(--color-stone-tint)', icon: 'var(--color-stone)' },
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
    <div>
      <LedgerStrip>
        {STATUS_ORDER.map((status) => (
          <StatTile
            key={status}
            label={statusLabel(status)}
            count={counts[status]}
            color={STATUS_STYLE[status].icon}
            bg={STATUS_STYLE[status].bg}
            icon={STATUS_ICON[status]}
          />
        ))}
      </LedgerStrip>
    </div>
  );
}
