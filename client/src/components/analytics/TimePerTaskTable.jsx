import { Link } from 'react-router-dom';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { StatusChip } from '../tasks/StatusChip';
import { formatDuration } from '../../lib/datetime';

// Phase 20, new — a table, not a chart: this is inherently a per-item
// ranking with more than one field (title + time + status), which a single
// bar-length encoding doesn't capture as well as a table's own columns do.
// Sorted descending, capped server-side (analyticsService.computeTimePerTask).
export function TimePerTaskTable({ data = [] }) {
  return (
    <ChartCard title="Time spent per task" description="Your most-tracked tasks in this range.">
      {data.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-(--radius-lg) border border-(--border-hairline) bg-surface">
          <table className="w-full text-left text-meta">
            <thead>
              <tr className="border-b border-(--color-rule) text-micro text-ink-3">
                <th className="px-4 py-2 font-normal">Task</th>
                <th className="px-4 py-2 font-normal">Status</th>
                <th className="px-4 py-2 text-right font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-(--color-rule) last:border-b-0">
                  <td className="max-w-[160px] truncate px-4 py-2 text-ink">
                    {row.status ? (
                      <Link to={`/tasks/${row.status.toLowerCase()}/${row.id}`} className="hover:underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                  </td>
                  <td className="px-4 py-2">{row.status ? <StatusChip status={row.status} /> : '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink-2">{formatDuration(row.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ChartEmpty message="No time tracked yet." />
      )}
    </ChartCard>
  );
}
