import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { useTasksContext } from '../../lib/tasksStore';

// DESIGN.md v3 §7 — scrollable status pills with counts, scroll-snap,
// selected pill scrolled into view on mount, plus a sort + list/grid view
// toggle row beneath it. Sort and view-mode are both purely client-side
// (no new API param, no persisted server state) — sort re-orders the
// already-fetched section list, and the view toggle only switches
// TaskList's layout className.
const FILTERS = [
  { status: 'active', label: 'Active', color: 'var(--color-active)' },
  { status: 'missed', label: 'Needs review', color: 'var(--color-review)' },
  { status: 'completed', label: 'Completed', color: 'var(--color-completed)' },
  { status: 'incomplete', label: 'Not done', color: 'var(--color-notdone)' },
  { status: 'deleted', label: 'Deleted', color: 'var(--color-deleted)' },
];

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Due soon' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Newest' },
];

export function FilterRow({ selected, counts = {} }) {
  const containerRef = useRef(null);
  const selectedRef = useRef(null);
  const { sortBy, setSortBy, viewMode, setViewMode } = useTasksContext();

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <div className="flex flex-col gap-2 pb-3">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-gutter"
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
              className="flex min-h-(--size-tap-min) shrink-0 snap-start items-center gap-1.5 rounded-(--radius-pill) border px-3 py-1.5 text-meta transition-colors"
              style={{
                borderColor: isSelected ? filter.color : 'var(--border-hairline)',
                color: isSelected ? filter.color : 'var(--color-ink-2)',
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${filter.color} 14%, var(--color-surface))`
                  : 'transparent',
              }}
            >
              {filter.label}
              <span className="font-tabular text-micro" style={{ color: isSelected ? filter.color : 'var(--color-ink-3)' }}>
                {counts[filter.status] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 px-gutter">
        <label className="flex items-center gap-1.5 text-meta text-ink-2">
          Sort by
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-(--radius-sm) border border-(--border-hairline) bg-surface px-2 py-1 text-meta text-ink"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-(--radius-md) border border-(--border-hairline) p-0.5">
          <ViewModeButton mode="list" current={viewMode} onSelect={setViewMode} icon={List} label="List view" />
          <ViewModeButton mode="grid" current={viewMode} onSelect={setViewMode} icon={LayoutGrid} label="Grid view" />
        </div>
      </div>
    </div>
  );
}

function ViewModeButton({ mode, current, onSelect, icon: Icon, label }) {
  const active = mode === current;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={() => onSelect(mode)}
      className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm) transition-colors"
      style={{
        color: active ? 'var(--color-brand)' : 'var(--color-ink-3)',
        backgroundColor: active ? 'var(--color-brand-soft)' : 'transparent',
      }}
    >
      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
