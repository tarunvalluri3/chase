import { LedgerStrip, StatTile } from '../dashboard/StatTile';
import { formatDuration } from '../../lib/datetime';

// Phase 20 — top-of-page KPI row, same LedgerStrip/StatTile primitives as
// the Home dashboard's StatusCounts (DESIGN.md §4.1/§7), so a new set of
// KPI tiles doesn't introduce a second visual language for "a few numbers
// at a glance." Reuses existing status-color tokens, no new hues.
export function KpiRow({ kpis }) {
  const tiles = [
    { key: 'total', label: 'Total tasks', count: kpis.totalTasks },
    { key: 'completion', label: 'Completion rate', count: formatPercent(kpis.completionRate) },
    { key: 'missed', label: 'Missed rate', count: formatPercent(kpis.missedRate) },
    { key: 'deletion', label: 'Deletion rate', count: formatPercent(kpis.deletionRate) },
    { key: 'tracked', label: 'Time tracked', count: formatDuration(kpis.totalTrackedSeconds) },
  ];

  return (
    <div>
      <LedgerStrip>
        {tiles.map((tile) => (
          <StatTile key={tile.key} label={tile.label} count={tile.count} />
        ))}
      </LedgerStrip>
    </div>
  );
}

function formatPercent(rate) {
  return `${Math.round(rate * 100)}%`;
}
