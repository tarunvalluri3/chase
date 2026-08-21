import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';

// DESIGN.md §12 — ranked horizontal bars over the user's own free-typed
// reasons (not an enum, per CLAUDE.md's data model — grouped by exact
// trimmed text server-side in analyticsService.js, top 5 plus "Other").
// Reason labels
// use Sans (user-authored copy, §2.2's "warm" family); the count uses Mono
// (the app's own tally). Bar length already encodes magnitude, so one flat
// hue is enough — no ramp needed.
export function ReasonBreakdownChart({ title, description, data, emptyMessage }) {
  const height = Math.max(data.length * 36, 60);

  return (
    <ChartCard title={title} description={description}>
      {data.length > 0 ? (
        <div>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                dataKey="reason"
                type="category"
                width={112}
                interval={0}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)}
              />
              <Tooltip formatter={(value) => [value, 'Count']} />
              <Bar dataKey="count">
                <LabelList dataKey="count" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message={emptyMessage} />
      )}
    </ChartCard>
  );
}
