import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

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
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(value) => [value, 'Not done']} />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No confirmed-incomplete tasks yet." />
      )}
    </ChartCard>
  );
}
