import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChartCard } from '../ChartCard';
import { CompletionTrendChart } from '../CompletionTrendChart';
import { ReasonBreakdownChart } from '../ReasonBreakdownChart';
import { PriorityBreakdown } from '../PriorityBreakdown';
import { UnresolvedMissed } from '../UnresolvedMissed';
import { KpiRow } from '../KpiRow';
import { DateRangeFilter } from '../DateRangeFilter';
import { StatusComparisonChart } from '../StatusComparisonChart';
import { MissedTrendChart } from '../MissedTrendChart';
import { DeadlinePerformanceChart } from '../DeadlinePerformanceChart';
import { TimeTrackedTrendChart } from '../TimeTrackedTrendChart';
import { TimePerTaskTable } from '../TimePerTaskTable';
import { TimeVsOutcomeChart } from '../TimeVsOutcomeChart';
import { PriorityTimeChart } from '../PriorityTimeChart';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ChartCard', () => {
  it('renders a title, optional description, and its children', () => {
    render(
      <ChartCard title="Completed over time" description="Weekly completions">
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByText('Completed over time')).toBeInTheDocument();
    expect(screen.getByText('Weekly completions')).toBeInTheDocument();
    expect(screen.getByText('chart body')).toBeInTheDocument();
  });

  it('omits the description paragraph entirely when none is given', () => {
    render(<ChartCard title="No description here">content</ChartCard>);
    expect(screen.getByRole('heading')).toHaveTextContent('No description here');
  });
});

describe('CompletionTrendChart', () => {
  it('shows its own empty state when there is no completion data', () => {
    renderWithRouter(<CompletionTrendChart data={[{ week: '2026-08-10', label: 'Aug 10', onTime: 0, resolved: 0 }]} />);
    expect(screen.getByText("No completions yet. They'll show up here as you go.")).toBeInTheDocument();
  });

  it('renders the chart (not the empty state) once there is at least one completed week', () => {
    renderWithRouter(<CompletionTrendChart data={[{ week: '2026-08-10', label: 'Aug 10', onTime: 1, resolved: 0 }]} />);
    expect(screen.queryByText("No completions yet. They'll show up here as you go.")).not.toBeInTheDocument();
  });
});

describe('ReasonBreakdownChart', () => {
  it('shows the given empty message when there is no data', () => {
    render(
      <ReasonBreakdownChart
        title="Why tasks didn't get done"
        data={[]}
        color="var(--color-notdone)"
        emptyMessage="No confirmed-incomplete tasks yet."
      />,
    );
    expect(screen.getByText('No confirmed-incomplete tasks yet.')).toBeInTheDocument();
  });

  it('renders ranked bars for each reason when data is present', () => {
    render(
      <ReasonBreakdownChart
        title="Why tasks didn't get done"
        data={[{ reason: 'Underestimated scope', count: 4 }]}
        color="var(--color-notdone)"
        emptyMessage="empty"
      />,
    );
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
  });
});

describe('PriorityBreakdown', () => {
  it('shows its empty state when there is no completed/incomplete data yet', () => {
    renderWithRouter(<PriorityBreakdown breakdown={[]} />);
    expect(
      screen.getByText('Not enough completed or confirmed-incomplete tasks yet to break this down.'),
    ).toBeInTheDocument();
  });

  it('renders once there is at least one COMPLETED or INCOMPLETE task', () => {
    renderWithRouter(
      <PriorityBreakdown
        breakdown={[{ priority: 'HIGH', completed: 1, incomplete: 0, total: 1, incompleteRate: 0 }]}
      />,
    );
    expect(
      screen.queryByText('Not enough completed or confirmed-incomplete tasks yet to break this down.'),
    ).not.toBeInTheDocument();
  });
});

describe('UnresolvedMissed', () => {
  it('shows "Nothing waiting on you." when there are no unresolved MISSED tasks', () => {
    renderWithRouter(<UnresolvedMissed missed={[]} />);
    expect(screen.getByText('Nothing waiting on you.')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('lists unresolved MISSED tasks oldest-first, with a live count', () => {
    const older = { id: 't-1', title: 'Old missed', missed_at: new Date(Date.now() - 2 * 86400_000).toISOString() };
    const newer = { id: 't-2', title: 'New missed', missed_at: new Date(Date.now() - 3600_000).toISOString() };
    renderWithRouter(<UnresolvedMissed missed={[older, newer]} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Old missed');
    expect(items[1]).toContain('New missed');
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('KpiRow', () => {
  it('renders every KPI tile with formatted values', () => {
    render(
      <KpiRow
        kpis={{
          totalTasks: 12,
          completionRate: 0.75,
          missedRate: 0.1,
          deletionRate: 0.05,
          totalTrackedSeconds: 3661,
        }}
      />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('1:01:01')).toBeInTheDocument();
  });
});

describe('DateRangeFilter', () => {
  it('marks the selected range and calls onChange when another is picked', async () => {
    let selected = 'all';
    const { rerender } = render(<DateRangeFilter range={selected} onChange={(next) => (selected = next)} />);
    const allTime = screen.getByRole('button', { name: 'All time' });
    expect(allTime).toHaveAttribute('aria-pressed', 'true');

    screen.getByRole('button', { name: '30 days' }).click();
    expect(selected).toBe('30d');

    rerender(<DateRangeFilter range={selected} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('StatusComparisonChart', () => {
  it('shows its empty state when every count is zero', () => {
    render(<StatusComparisonChart kpis={{ completedTasks: 0, missedEverTasks: 0, deletedTasks: 0 }} />);
    expect(screen.getByText('Nothing to compare yet.')).toBeInTheDocument();
  });

  it('renders once at least one count is nonzero', () => {
    render(<StatusComparisonChart kpis={{ completedTasks: 3, missedEverTasks: 0, deletedTasks: 0 }} />);
    expect(screen.queryByText('Nothing to compare yet.')).not.toBeInTheDocument();
  });
});

describe('MissedTrendChart', () => {
  it('shows its empty state with no missed detections', () => {
    render(<MissedTrendChart data={[{ week: '2026-08-10', label: 'Aug 10', count: 0 }]} />);
    expect(screen.getByText('No missed deadlines yet.')).toBeInTheDocument();
  });
});

describe('DeadlinePerformanceChart', () => {
  it('shows its empty state with no completed tasks', () => {
    render(<DeadlinePerformanceChart data={{ onTime: 0, late: 0, total: 0 }} />);
    expect(screen.getByText('No completed tasks yet.')).toBeInTheDocument();
  });

  it('renders once there is at least one completed task', () => {
    render(<DeadlinePerformanceChart data={{ onTime: 2, late: 1, total: 3 }} />);
    expect(screen.queryByText('No completed tasks yet.')).not.toBeInTheDocument();
  });
});

describe('TimeTrackedTrendChart', () => {
  it('shows "No time tracked yet." when every week is zero', () => {
    render(<TimeTrackedTrendChart data={[{ week: '2026-08-10', label: 'Aug 10', seconds: 0 }]} />);
    expect(screen.getByText('No time tracked yet.')).toBeInTheDocument();
  });
});

describe('TimePerTaskTable', () => {
  it('shows its empty state with no tracked tasks', () => {
    render(<TimePerTaskTable data={[]} />);
    expect(screen.getByText('No time tracked yet.')).toBeInTheDocument();
  });

  it('renders a row per task with a formatted duration', () => {
    renderWithRouter(<TimePerTaskTable data={[{ id: 't-1', title: 'Write report', status: 'ACTIVE', seconds: 125 }]} />);
    expect(screen.getByText('Write report')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });
});

describe('TimeVsOutcomeChart', () => {
  it('shows its empty state with no outcome data', () => {
    render(
      <TimeVsOutcomeChart
        data={[
          { status: 'COMPLETED', avgSeconds: 0, count: 0 },
          { status: 'INCOMPLETE', avgSeconds: 0, count: 0 },
          { status: 'DELETED', avgSeconds: 0, count: 0 },
        ]}
      />,
    );
    expect(screen.getByText('No tracked time on completed, not-done, or deleted tasks yet.')).toBeInTheDocument();
  });
});

describe('PriorityTimeChart', () => {
  it('shows its empty state with no tracked time', () => {
    render(
      <PriorityTimeChart
        data={[
          { priority: 'HIGH', avgSeconds: 0, count: 0 },
          { priority: 'MEDIUM', avgSeconds: 0, count: 0 },
          { priority: 'LOW', avgSeconds: 0, count: 0 },
        ]}
      />,
    );
    expect(screen.getByText('No tracked time yet.')).toBeInTheDocument();
  });
});
