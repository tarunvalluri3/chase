import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// Phase 20, new — one direct-comparison snapshot for the selected range,
// alongside (not instead of) the existing per-status trend charts, which
// already show shape over time. Reuses each status's own existing color
// token, same as StatusCounts on the Home dashboard.
export function StatusComparisonChart({ kpis }) {
  const data = [
    { key: 'completed', label: 'Completed', count: kpis.completedTasks, fill: 'var(--color-completed)' },
    { key: 'missed', label: 'Missed', count: kpis.missedEverTasks, fill: 'var(--color-review)' },
    { key: 'deleted', label: 'Deleted', count: kpis.deletedTasks, fill: 'var(--color-deleted)' },
  ];
  const hasData = data.some((entry) => entry.count > 0);

  return (
    <ChartCard title="Completed vs. missed vs. deleted" description="A direct comparison for the selected range.">
      {hasData ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap="32%">
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={80} tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'var(--color-surface-sunken)' }}
                formatter={(value) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
                <LabelList dataKey="count" position="right" fill="var(--color-ink-2)" fontFamily="var(--font-sans)" fontSize={11} />
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
