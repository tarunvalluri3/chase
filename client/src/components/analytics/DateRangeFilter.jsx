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
    <div className="flex gap-2 overflow-x-auto px-gutter" role="group" aria-label="Date range">
      {OPTIONS.map((option) => {
        const isSelected = option.value === range;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className="min-h-(--size-tap-min) shrink-0 rounded-(--radius-pill) border px-3 py-1.5 text-meta transition-colors"
            style={{
              borderColor: isSelected ? 'var(--color-accent)' : 'var(--border-hairline)',
              color: isSelected ? 'var(--color-accent)' : 'var(--color-ink-2)',
              backgroundColor: isSelected
                ? 'color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))'
                : 'transparent',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
