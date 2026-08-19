import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, CHART_GRID_COLOR, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// Phase 20, new — weekly count of missed_at occurrences (detection events),
// independent of whether the task was later resolved as COMPLETED or
// INCOMPLETE. Deliberately distinct from IncompleteTrendChart: this counts
// "the deadline passed," never "the work was never done" (CLAUDE.md). Amber
// (--color-review) per §2.4, matching UnresolvedMissed's own "a passed
// deadline is a question, not a verdict" color choice.
export function MissedTrendChart({ data = [] }) {
  const hasData = data.some((week) => week.count > 0);

  return (
    <ChartCard
      title="Missed detections over time"
      description="How often a deadline passed before you confirmed the task, by week — not the same as never finishing it."
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
                formatter={(value) => [value, 'Missed']}
              />
              <Bar dataKey="count" fill="var(--color-review)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No missed deadlines yet." />
      )}
    </ChartCard>
  );
}
