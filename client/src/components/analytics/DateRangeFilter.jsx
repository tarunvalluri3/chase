// Phase 20 — one range control driving every section on the page (a single
// filter, not per-chart filters, per the phase's own "avoid overcrowding"
// UX instruction). Styled as a segmented pill row, matching FilterRow's
// existing selected/unselected treatment rather than introducing a new
// control shape.
const OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export function DateRangeFilter({ range, onChange }) {
  return (
    <div role="group" aria-label="Date range">
      {OPTIONS.map((option) => {
        const isSelected = option.value === range;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
