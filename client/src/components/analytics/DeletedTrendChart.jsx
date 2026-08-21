import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

// DESIGN.md §12 — weekly count of deleted tasks, keyed to deleted_at.
// `data` is pre-aggregated server-side (Phase 20).
export function DeletedTrendChart({ data = [] }) {
  const hasData = data.some((week) => week.count > 0);

  return (
    <ChartCard title="Deleted over time" description="Tasks you removed, by the week you removed them.">
      {hasData ? (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(value) => [value, 'Deleted']} />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Nothing deleted yet." />
      )}
    </ChartCard>
  );
}
