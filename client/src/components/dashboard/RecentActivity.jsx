import { computeRecentActivity } from '../../lib/taskStats';
import { TaskCard } from '../tasks/TaskCard';

// Maps a task's current status to the route its detail page lives under
// (DESIGN.md §6 status-filter routes) — same lowercase slugs TaskList uses.
const SECTION_ROUTE = {
  ACTIVE: 'active',
  MISSED: 'missed',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
  DELETED: 'deleted',
};

// DESIGN.md §4.1/§9 — the most-recently-touched tasks across every status,
// sorted client-side from the same unfiltered fetch StatusCounts uses.
// Upgraded from a plain row (v1) to a real TaskCard per §4.1: this is the
// one place a summary section renders individually-actioned task records,
// so it gets card treatment, not ledger rows. TaskCard's own lifecycle
// rules already render actions only on ACTIVE/MISSED tasks, so a
// COMPLETED/INCOMPLETE/DELETED entry here shows no action row.
export function RecentActivity({ tasks }) {
  const activity = computeRecentActivity(tasks);
  if (activity.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-gutter">
      <h2 className="text-section text-ink">Recent activity</h2>
      <ul className="flex flex-col gap-(--spacing-stack-gap)">
        {activity.map(({ task }) => (
          <li key={task.id}>
            <TaskCard task={task} sectionStatus={SECTION_ROUTE[task.status]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
