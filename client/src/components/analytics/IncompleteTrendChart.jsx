import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, CHART_GRID_COLOR, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// DESIGN.md §12 — weekly count of tasks confirmed INCOMPLETE (keyed to
// incomplete_at, the user's own confirmation — never missed_at, since
// CLAUDE.md treats MISSED as a pending checkpoint, not the outcome). `data`
// is pre-aggregated server-side (Phase 20).
export function IncompleteTrendChart({ data = [] }) {
  const hasData = data.some((week) => week.count > 0);

  return (
    <ChartCard
      title="Confirmed not done, over time"
      description="Tasks you confirmed were never finished, by the week you confirmed it."
    >
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
                cursor={{ fill: 'var(--color-surface-sunken)' }}
                formatter={(value) => [value, 'Not done']}
              />
              <Bar dataKey="count" fill="var(--color-notdone)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No confirmed-incomplete tasks yet." />
      )}
    </ChartCard>
  );
}
