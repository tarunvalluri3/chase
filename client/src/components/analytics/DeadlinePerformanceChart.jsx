import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { legendTextStyle, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';

// Phase 20, new — compares completed_at directly to deadline for every
// completed task in range, catching a task finished late while still
// ACTIVE (before any lazy MISSED transition ran), not just ones that
// visibly passed through MISSED first. Two-slice donut sharing the
// Completed hue at two opacities (the same "on time vs. resolved" idea
// CompletionTrendChart already uses) — no new categorical color.
export function DeadlinePerformanceChart({ data }) {
  const { onTime = 0, late = 0, total = 0 } = data ?? {};

  const chartData = [
    { key: 'onTime', label: 'On time', value: onTime, fill: 'var(--color-completed)' },
    { key: 'late', label: 'Completed late', value: late, fill: 'var(--color-chart-completed-resolved)' },
  ];

  return (
    <ChartCard title="Deadline performance" description="Of completed tasks, the share finished at or before their deadline.">
      {total > 0 ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(value, name) => [`${value} of ${total}`, name]}
              />
              <Legend wrapperStyle={legendTextStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No completed tasks yet." />
      )}
    </ChartCard>
  );
}
