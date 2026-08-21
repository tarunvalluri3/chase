import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartEmpty } from './ChartStates';
import { axisTickStyle, tooltipContentStyle, tooltipLabelStyle } from './chartTheme';
import { formatDuration } from '../../lib/datetime';

const LABEL = { COMPLETED: 'Completed', INCOMPLETE: 'Not done', DELETED: 'Deleted' };
const COLOR = { COMPLETED: 'var(--color-completed)', INCOMPLETE: 'var(--color-notdone)', DELETED: 'var(--color-deleted)' };

// Phase 20, new — average tracked time per task, grouped by the task's
// current terminal status. Only possible now that time-tracking data
// (Phase 19) exists alongside task outcomes.
export function TimeVsOutcomeChart({ data = [] }) {
  const rows = data.map((entry) => ({ ...entry, label: LABEL[entry.status] ?? entry.status, fill: COLOR[entry.status] }));
  const hasData = rows.some((entry) => entry.count > 0);

  return (
    <ChartCard title="Time spent vs. outcome" description="Average tracked time per task, by how it ended.">
      {hasData ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap="32%">
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={80} tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'var(--color-surface-sunken)' }}
                formatter={(value, _name, item) => [`${formatDuration(value)} avg (${item.payload.count} tasks)`, 'Time']}
              />
              <Bar dataKey="avgSeconds" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {rows.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="avgSeconds"
                  position="right"
                  formatter={(value) => formatDuration(value)}
                  fill="var(--color-ink-2)"
                  fontFamily="var(--font-sans)"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="No tracked time on completed, not-done, or deleted tasks yet." />
      )}
    </ChartCard>
  );
}
