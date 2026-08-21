import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

const LEGEND_LABEL = { onTime: 'On time', resolved: 'After review' };

// DESIGN.md §12 — stacked weekly bars sharing the Completed hue (secondary
// encoding via opacity, not a new categorical color): on-time completions
// vs. tasks confirmed complete after passing through MISSED first. `data`
// is pre-aggregated server-side (Phase 20, analyticsService.computeCompletionTrend)
// — this component is pure presentation.
export function CompletionTrendChart({ data = [] }) {
  const hasData = data.some((week) => week.onTime > 0 || week.resolved > 0);

  return (
    <ChartCard
      title="Completed over time"
      description="Weekly completions — on time vs. confirmed complete after review."
    >
      {hasData ? (
        <div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(value, key) => [value, LEGEND_LABEL[key] ?? key]} />
              <Legend formatter={(value) => LEGEND_LABEL[value] ?? value} />
              <Bar dataKey="onTime" stackId="completed" />
              <Bar dataKey="resolved" stackId="completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No completions yet. They'll show up here as you go." />
      )}
    </ChartCard>
  );
}
