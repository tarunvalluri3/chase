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
        <div>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.status ? (
                      <Link to={`/tasks/${row.status.toLowerCase()}/${row.id}`}>
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                  </td>
                  <td>{row.status ? <StatusChip status={row.status} /> : '—'}</td>
                  <td>{formatDuration(row.seconds)}</td>
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
