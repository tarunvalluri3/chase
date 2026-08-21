import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PRIORITY_CONFIG, priorityText } from '../tasks/priorityConfig';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// DESIGN.md §12 — priority stays monochrome in charts too (§2.5's rule
// isn't just a task-card rule): reuses PriorityRail's exact rail colors
// rather than a chart-only categorical hue, so priority never competes with
// status color anywhere in the app. Only 3 categories, so every bar is
// direct-labeled — no legend needed. `breakdown` is pre-aggregated
// server-side (Phase 20, analyticsService.computePriorityBreakdown).
export function PriorityBreakdown({ breakdown = [] }) {
  const data = breakdown.map((entry) => ({
    ...entry,
    label: priorityText(entry.priority),
    percent: Math.round(entry.incompleteRate * 100),
  }));
  const hasData = data.some((entry) => entry.total > 0);

  return (
    <ChartCard
      title="Not done, by priority"
      description="Of tasks completed or confirmed not done, the share that ended up not done."
    >
      {hasData ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap="32%">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="label" type="category" width={64} tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'var(--color-surface-sunken)' }}
                formatter={(_, __, item) => {
                  const d = item.payload;
                  return [`${d.incomplete} of ${d.total}`, 'Not done'];
                }}
              />
              <Bar dataKey="percent" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_CONFIG[entry.priority].rail} />
                ))}
                <LabelList
                  dataKey="percent"
                  position="right"
                  formatter={(value) => `${value}%`}
                  fill="var(--color-ink-2)"
                  fontFamily="var(--font-sans)"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Not enough completed or confirmed-incomplete tasks yet to break this down." />
      )}
    </ChartCard>
  );
}
