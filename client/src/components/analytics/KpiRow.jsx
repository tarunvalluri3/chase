import { LedgerStrip, StatTile } from '../dashboard/StatTile';
import { formatDuration } from '../../lib/datetime';

// Phase 20 — top-of-page KPI row, same LedgerStrip/StatTile primitives as
// the Home dashboard's StatusCounts (DESIGN.md §4.1/§7), so a new set of
// KPI tiles doesn't introduce a second visual language for "a few numbers
// at a glance." Reuses existing status-color tokens, no new hues.
export function KpiRow({ kpis }) {
  const tiles = [
    { key: 'total', label: 'Total tasks', count: kpis.totalTasks, color: 'var(--color-ink-2)' },
    { key: 'completion', label: 'Completion rate', count: formatPercent(kpis.completionRate), color: 'var(--color-completed)' },
    { key: 'missed', label: 'Missed rate', count: formatPercent(kpis.missedRate), color: 'var(--color-review)' },
    { key: 'deletion', label: 'Deletion rate', count: formatPercent(kpis.deletionRate), color: 'var(--color-deleted)' },
    { key: 'tracked', label: 'Time tracked', count: formatDuration(kpis.totalTrackedSeconds), color: 'var(--color-ink-2)' },
  ];

  return (
    <div className="px-gutter">
      <LedgerStrip className="overflow-x-auto">
        {tiles.map((tile) => (
          <StatTile key={tile.key} label={tile.label} count={tile.count} color={tile.color} />
        ))}
      </LedgerStrip>
    </div>
  );
}

function formatPercent(rate) {
  return `${Math.round(rate * 100)}%`;
}
