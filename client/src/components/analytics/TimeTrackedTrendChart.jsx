import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { formatDuration } from '../../lib/datetime';

// Phase 20, new — weekly tracked time (Phase 19's work_sessions), bucketed
// by each segment's started_at on the same weekly axis as the task trend
// charts, for one consistent time axis across the page. Area, not bars,
// since this reads as accumulation over a stretch of weeks rather than
// discrete per-week events.
export function TimeTrackedTrendChart({ data = [] }) {
  const hasData = data.some((week) => week.seconds > 0);

  return (
    <ChartCard title="Time tracked over time" description="Weekly tracked time across all tasks.">
      {hasData ? (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(value) => formatDuration(value)}
              />
              <Tooltip formatter={(value) => [formatDuration(value), 'Tracked']} />
              <Area type="monotone" dataKey="seconds" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No time tracked yet." />
      )}
    </ChartCard>
  );
}
