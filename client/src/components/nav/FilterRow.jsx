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
  { status: 'active', label: 'Active' },
  { status: 'missed', label: 'Needs review' },
  { status: 'completed', label: 'Completed' },
  { status: 'incomplete', label: 'Not done' },
  { status: 'deleted', label: 'Deleted' },
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
    <div>
      <div ref={containerRef}>
        {FILTERS.map((filter) => {
          const isSelected = filter.status === selected;
          return (
            <Link
              key={filter.status}
              ref={isSelected ? selectedRef : undefined}
              to={`/tasks/${filter.status}`}
              aria-current={isSelected ? 'true' : undefined}
            >
              {filter.label}
              <span>{counts[filter.status] ?? 0}</span>
            </Link>
          );
        })}
      </div>

      <div>
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div>
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
    <button type="button" aria-pressed={active} aria-label={label} onClick={() => onSelect(mode)}>
      <Icon aria-hidden="true" />
    </button>
  );
}
