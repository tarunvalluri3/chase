import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { computeDeletedTrend } from '../../lib/analyticsStats';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, CHART_GRID_COLOR, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// DESIGN.md §12 — weekly count of deleted tasks, keyed to deleted_at.
export function DeletedTrendChart({ tasks }) {
  const data = computeDeletedTrend(tasks);
  const hasData = data.some((week) => week.count > 0);

  return (
    <ChartCard title="Deleted over time" description="Tasks you removed, by the week you removed them.">
      {hasData ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="label" tick={axisTickStyle} axisLine={{ stroke: CHART_GRID_COLOR }} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTickStyle} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'var(--color-overlay)' }}
                formatter={(value) => [value, 'Deleted']}
              />
              <Bar dataKey="count" fill="var(--color-deleted)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Nothing deleted yet." />
      )}
    </ChartCard>
  );
}
