import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { computeCompletionTrend } from '../../lib/analyticsStats';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, CHART_GRID_COLOR, legendTextStyle, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

const LEGEND_LABEL = { onTime: 'On time', resolved: 'After review' };

// DESIGN.md §12 — stacked weekly bars sharing the Completed hue (secondary
// encoding via opacity, not a new categorical color): on-time completions
// vs. tasks confirmed complete after passing through MISSED first.
export function CompletionTrendChart({ tasks }) {
  const data = computeCompletionTrend(tasks);
  const hasData = data.some((week) => week.onTime > 0 || week.resolved > 0);

  return (
    <ChartCard
      title="Completed over time"
      description="Weekly completions — on time vs. confirmed complete after review."
    >
      {hasData ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="label" tick={axisTickStyle} axisLine={{ stroke: CHART_GRID_COLOR }} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTickStyle} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'var(--color-overlay)' }}
                formatter={(value, key) => [value, LEGEND_LABEL[key] ?? key]}
              />
              <Legend
                wrapperStyle={legendTextStyle}
                formatter={(value) => LEGEND_LABEL[value] ?? value}
              />
              <Bar dataKey="onTime" stackId="completed" fill="var(--color-completed)" maxBarSize={28} />
              <Bar
                dataKey="resolved"
                stackId="completed"
                fill="var(--color-chart-completed-resolved)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No completions yet. They'll show up here as you go." />
      )}
    </ChartCard>
  );
}
