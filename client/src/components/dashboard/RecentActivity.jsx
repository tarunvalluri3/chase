import { Link } from 'react-router-dom';
import { computeRecentActivity } from '../../lib/taskStats';
import { formatDeadline } from '../../lib/datetime';

// Maps a task's current status to the route its detail page lives under
// (DESIGN.md §6 status-filter routes) — same lowercase slugs TaskList uses.
const SECTION_ROUTE = {
  ACTIVE: 'active',
  MISSED: 'missed',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
  DELETED: 'deleted',
};

// DESIGN.md §7 `RecentActivity` — the most-recently-touched tasks across
// every status, sorted client-side from the same unfiltered fetch
// StatusCounts uses. formatDeadline already renders relative-vs-absolute
// for any ISO timestamp, past or future, so it's reused as-is here.
export function RecentActivity({ tasks }) {
  const activity = computeRecentActivity(tasks);
  if (activity.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-gutter">
      <h2 className="text-section text-ink">Recent activity</h2>
      <ul className="flex flex-col gap-2">
        {activity.map(({ task, verb, timestamp }) => (
          <li key={task.id}>
            <Link
              to={`/tasks/${SECTION_ROUTE[task.status]}/${task.id}`}
              className="flex items-center justify-between gap-3 rounded-(--radius-md) border border-(--border-hairline) bg-surface px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="line-clamp-1 text-task text-ink">{task.title}</span>
                <span className="text-meta text-ink-3">{verb}</span>
              </div>
              <time dateTime={timestamp} className="shrink-0 font-mono text-meta text-ink-3">
                {formatDeadline(timestamp)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
