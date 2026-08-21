import { Link } from 'react-router-dom';
import { formatTimestamp } from '../../lib/datetime';

const VISIBLE_LIMIT = 5;

// DESIGN.md §12 / CLAUDE.md — MISSED is a pending checkpoint, not a trend,
// so it's surfaced here as a current "needs attention" count + list
// (oldest-first, i.e. longest unresolved) rather than a historical chart.
// Amber per §2.4; never red — a passed deadline is a question, not a verdict.
// `missed` is pre-computed server-side (Phase 20,
// analyticsService.computeUnresolvedMissed) — not range-filtered, since
// this is always a current snapshot, not history.
export function UnresolvedMissed({ missed = [] }) {
  return (
    <div>
      <div>
        <h2>Needs review</h2>
        <span>{missed.length}</span>
      </div>

      {missed.length === 0 ? (
        <div>
          Nothing waiting on you.
        </div>
      ) : (
        <ul>
          {missed.slice(0, VISIBLE_LIMIT).map((task) => (
            <li key={task.id}>
              <Link to={`/tasks/missed/${task.id}`}>
                <span>{task.title}</span>
                <span>since {formatTimestamp(task.missed_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {missed.length > VISIBLE_LIMIT && (
        <Link to="/tasks/missed">
          View all {missed.length} →
        </Link>
      )}
    </div>
  );
}
