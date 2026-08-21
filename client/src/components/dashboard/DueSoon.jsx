import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { computeDueSoon } from '../../lib/taskStats';
import { DeadlineDisplay } from '../tasks/DeadlineDisplay';

// DESIGN.md §4.1/§9 "highlight anything time-sensitive" — active tasks due
// within the next 24h. This is summary/scan content, so it renders as
// ledger rows (thin hairline dividers, no card chrome) rather than the
// bordered-box treatment task lists use. Each row gets the same leading
// icon-badge + status-accent-border treatment as an activity row (DESIGN.md
// v3 §7.6): brand tint since a due-soon item is still ACTIVE, never the
// danger/red token — this is a heads-up, never a verdict.
// Renders nothing once there's nothing due soon, rather than an empty
// section header.
export function DueSoon({ tasks }) {
  const dueSoon = computeDueSoon(tasks);
  if (dueSoon.length === 0) return null;

  return (
    <div>
      <h2>Due soon</h2>
      <ul>
        {dueSoon.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/active/${task.id}`}>
              <span aria-hidden="true">
                <Clock />
              </span>
              <span>{task.title}</span>
              <DeadlineDisplay deadline={task.deadline} variant="accent" />
              <ChevronRight aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
