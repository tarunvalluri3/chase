import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// DESIGN.md §6 Tasks tab / §7 component table — scrollable status pills with
// counts, scroll-snap, selected pill scrolled into view on mount. Counts are
// stubbed here; Phase 12 wires real per-status counts from the API.
const FILTERS = [
  { status: 'active', label: 'Active', color: 'var(--color-active)' },
  { status: 'missed', label: 'Needs review', color: 'var(--color-review)' },
  { status: 'completed', label: 'Completed', color: 'var(--color-completed)' },
  { status: 'incomplete', label: 'Not done', color: 'var(--color-notdone)' },
  { status: 'deleted', label: 'Deleted', color: 'var(--color-deleted)' },
];

export function FilterRow({ selected, counts = {} }) {
  const containerRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-gutter pb-3"
      style={{ scrollbarWidth: 'none' }}
    >
      {FILTERS.map((filter) => {
        const isSelected = filter.status === selected;
        return (
          <Link
            key={filter.status}
            ref={isSelected ? selectedRef : undefined}
            to={`/tasks/${filter.status}`}
            aria-current={isSelected ? 'true' : undefined}
            className="flex shrink-0 snap-start items-center gap-1.5 rounded-(--radius-pill) border px-3 py-1.5 text-meta transition-colors"
            style={{
              borderColor: isSelected ? filter.color : 'var(--border-hairline)',
              color: isSelected ? filter.color : 'var(--color-ink-2)',
              backgroundColor: isSelected
                ? `color-mix(in srgb, ${filter.color} 14%, var(--color-surface))`
                : 'transparent',
            }}
          >
            {filter.label}
            <span className="font-mono text-micro" style={{ color: isSelected ? filter.color : 'var(--color-ink-3)' }}>
              {counts[filter.status] ?? 0}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
