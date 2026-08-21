import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

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
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(value) => [value, 'Missed']} />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No missed deadlines yet." />
      )}
    </ChartCard>
  );
}
