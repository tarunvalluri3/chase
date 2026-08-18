import { Link } from 'react-router-dom';
import { computeDueSoon } from '../../lib/taskStats';
import { DeadlineDisplay } from '../tasks/DeadlineDisplay';

// DESIGN.md §14's "highlight anything time-sensitive" — active tasks due
// within the next 24h. Amber per §2.4; this is a heads-up, never a verdict,
// so it never touches the danger/red token. Renders nothing once there's
// nothing due soon, rather than an empty section header.
export function DueSoon({ tasks }) {
  const dueSoon = computeDueSoon(tasks);
  if (dueSoon.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-gutter">
      <h2 className="text-section text-ink">Due soon</h2>
      <ul className="flex flex-col gap-2">
        {dueSoon.map((task) => (
          <li key={task.id}>
            <Link
              to={`/tasks/active/${task.id}`}
              className="flex items-center justify-between gap-3 rounded-(--radius-md) border bg-surface px-4 py-3"
              style={{ borderColor: 'color-mix(in srgb, var(--color-review) 45%, var(--border-hairline))' }}
            >
              <span className="line-clamp-1 text-task text-ink">{task.title}</span>
              <DeadlineDisplay deadline={task.deadline} className="shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
