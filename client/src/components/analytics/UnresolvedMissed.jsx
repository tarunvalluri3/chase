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
    <div className="flex flex-col gap-3 px-gutter">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-section text-ink">Needs review</h2>
        <span className="font-mono text-meta text-ink-3">{missed.length}</span>
      </div>

      {missed.length === 0 ? (
        <div className="rounded-(--radius-lg) border border-(--border-hairline) bg-surface px-4 py-3 text-meta text-ink-3">
          Nothing waiting on you.
        </div>
      ) : (
        <ul className="flex flex-col rounded-(--radius-lg) border border-(--border-hairline) bg-surface">
          {missed.slice(0, VISIBLE_LIMIT).map((task, index) => (
            <li key={task.id} className={index > 0 ? 'border-t border-(--color-rule)' : ''}>
              <Link to={`/tasks/missed/${task.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="line-clamp-1 text-task text-ink">{task.title}</span>
                <span className="shrink-0 font-mono text-meta text-ink-3">since {formatTimestamp(task.missed_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {missed.length > VISIBLE_LIMIT && (
        <Link to="/tasks/missed" className="text-meta text-accent">
          View all {missed.length} →
        </Link>
      )}
    </div>
  );
}
