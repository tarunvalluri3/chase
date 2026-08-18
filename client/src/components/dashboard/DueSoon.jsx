import { Link } from 'react-router-dom';
import { computeDueSoon } from '../../lib/taskStats';
import { DeadlineDisplay } from '../tasks/DeadlineDisplay';

// DESIGN.md §4.1/§9 "highlight anything time-sensitive" — active tasks due
// within the next 24h. This is summary/scan content, so it renders as
// ledger rows (thin hairline dividers, no card chrome) rather than the
// bordered-box treatment task lists use. Amber per §2.3; this is a
// heads-up, never a verdict, so it never touches the danger/red token.
// Renders nothing once there's nothing due soon, rather than an empty
// section header.
export function DueSoon({ tasks }) {
  const dueSoon = computeDueSoon(tasks);
  if (dueSoon.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-gutter">
      <h2 className="font-serif text-section text-ink">Due soon</h2>
      <ul className="flex flex-col rounded-(--radius-lg) border border-(--border-hairline) bg-surface">
        {dueSoon.map((task, index) => (
          <li key={task.id} className={index > 0 ? 'border-t border-(--color-rule)' : ''}>
            <Link to={`/tasks/active/${task.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="line-clamp-1 text-task text-ink">{task.title}</span>
              <DeadlineDisplay deadline={task.deadline} className="shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
