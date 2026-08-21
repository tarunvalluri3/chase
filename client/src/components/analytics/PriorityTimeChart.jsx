import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { priorityText } from '../tasks/priorityConfig';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { formatDuration } from '../../lib/datetime';

// Phase 20, new — average tracked time per task, grouped by priority.
// Monochrome rail colors, same as PriorityBreakdown, so priority still
// never competes with status color anywhere in the app.
export function PriorityTimeChart({ data = [] }) {
  const rows = data.map((entry) => ({ ...entry, label: priorityText(entry.priority) }));
  const hasData = rows.some((entry) => entry.count > 0);

  return (
    <ChartCard title="Time spent by priority" description="Average tracked time per task, by priority.">
      {hasData ? (
        <div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={64} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, _name, item) => [`${formatDuration(value)} avg (${item.payload.count} tasks)`, 'Time']}
              />
              <Bar dataKey="avgSeconds">
                {rows.map((entry) => (
                  <Cell key={entry.priority} />
                ))}
                <LabelList dataKey="avgSeconds" position="right" formatter={(value) => formatDuration(value)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No tracked time yet." />
      )}
    </ChartCard>
  );
}
