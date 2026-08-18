import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChartCard } from '../ChartCard';
import { CompletionTrendChart } from '../CompletionTrendChart';
import { ReasonBreakdownChart } from '../ReasonBreakdownChart';
import { PriorityBreakdown } from '../PriorityBreakdown';
import { UnresolvedMissed } from '../UnresolvedMissed';
import { buildTask } from '../../../test/testUtils';

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
    renderWithRouter(<CompletionTrendChart tasks={[]} />);
    expect(screen.getByText("No completions yet. They'll show up here as you go.")).toBeInTheDocument();
  });

  it('renders the chart (not the empty state) once there is at least one completed task', () => {
    const tasks = [buildTask({ status: 'COMPLETED', completed_at: new Date().toISOString() })];
    renderWithRouter(<CompletionTrendChart tasks={tasks} />);
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
    renderWithRouter(<PriorityBreakdown tasks={[buildTask({ status: 'ACTIVE' })]} />);
    expect(
      screen.getByText('Not enough completed or confirmed-incomplete tasks yet to break this down.'),
    ).toBeInTheDocument();
  });

  it('renders once there is at least one COMPLETED or INCOMPLETE task', () => {
    renderWithRouter(<PriorityBreakdown tasks={[buildTask({ status: 'COMPLETED', priority: 'HIGH' })]} />);
    expect(
      screen.queryByText('Not enough completed or confirmed-incomplete tasks yet to break this down.'),
    ).not.toBeInTheDocument();
  });
});

describe('UnresolvedMissed', () => {
  it('shows "Nothing waiting on you." when there are no unresolved MISSED tasks', () => {
    renderWithRouter(<UnresolvedMissed tasks={[buildTask({ status: 'ACTIVE' })]} />);
    expect(screen.getByText('Nothing waiting on you.')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('lists unresolved MISSED tasks oldest-first, with a live count', () => {
    const older = buildTask({ title: 'Old missed', status: 'MISSED', missed_at: new Date(Date.now() - 2 * 86400_000).toISOString() });
    const newer = buildTask({ title: 'New missed', status: 'MISSED', missed_at: new Date(Date.now() - 3600_000).toISOString() });
    renderWithRouter(<UnresolvedMissed tasks={[newer, older]} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Old missed');
    expect(items[1]).toContain('New missed');
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
