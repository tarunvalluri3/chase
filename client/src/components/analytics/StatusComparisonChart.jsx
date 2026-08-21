import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

// Phase 20, new — one direct-comparison snapshot for the selected range,
// alongside (not instead of) the existing per-status trend charts, which
// already show shape over time. Reuses each status's own existing color
// token, same as StatusCounts on the Home dashboard.
export function StatusComparisonChart({ kpis }) {
  const data = [
    { key: 'completed', label: 'Completed', count: kpis.completedTasks },
    { key: 'missed', label: 'Missed', count: kpis.missedEverTasks },
    { key: 'deleted', label: 'Deleted', count: kpis.deletedTasks },
  ];
  const hasData = data.some((entry) => entry.count > 0);

  return (
    <ChartCard title="Completed vs. missed vs. deleted" description="A direct comparison for the selected range.">
      {hasData ? (
        <div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={80} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [value, 'Count']} />
              <Bar dataKey="count">
                {data.map((entry) => (
                  <Cell key={entry.key} />
                ))}
                <LabelList dataKey="count" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Nothing to compare yet." />
      )}
    </ChartCard>
  );
}
