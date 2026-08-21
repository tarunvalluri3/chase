import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { StatTile } from '../StatTile';
import { StatusCounts } from '../StatusCounts';
import { DueSoon } from '../DueSoon';
import { RecentActivity } from '../RecentActivity';
import { buildTask, renderWithProviders } from '../../../test/testUtils';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// RecentActivity renders real TaskCards (DESIGN.md §4.1/§9), which reach
// into TasksProvider/ToastProvider via useTaskLifecycle — the plain
// MemoryRouter-only helper above is no longer enough for that section.
function renderRecentActivity(ui) {
  return renderWithProviders(ui);
}

describe('StatTile', () => {
  it('renders the count and label', () => {
    render(<StatTile label="Active" count={5} color="var(--color-active)" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    const { container } = render(
      <StatTile label="Active" count={5} color="var(--color-active)" icon={Activity} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('StatusCounts', () => {
  it('tallies each status and shows the chip-matching label wording', () => {
    const tasks = [
      buildTask({ status: 'ACTIVE' }),
      buildTask({ status: 'ACTIVE' }),
      buildTask({ status: 'MISSED' }),
      buildTask({ status: 'INCOMPLETE' }),
      buildTask({ status: 'COMPLETED' }),
      buildTask({ status: 'DELETED' }),
    ];
    renderWithRouter(<StatusCounts tasks={tasks} />);
    expect(screen.getByText('Needs review')).toBeInTheDocument();
    expect(screen.getByText('Not done')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('DueSoon', () => {
  it('renders nothing when nothing is due soon', () => {
    const { container } = renderWithRouter(
      <DueSoon tasks={[buildTask({ status: 'ACTIVE', deadline: new Date(Date.now() + 72 * 3600_000).toISOString() })]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists an ACTIVE task whose deadline is within 24h, excluding a far-out one', () => {
    const soon = buildTask({ title: 'Due soon task', status: 'ACTIVE', deadline: new Date(Date.now() + 3600_000).toISOString() });
    const later = buildTask({ title: 'Far out task', status: 'ACTIVE', deadline: new Date(Date.now() + 72 * 3600_000).toISOString() });
    renderWithRouter(<DueSoon tasks={[soon, later]} />);
    expect(screen.getByText('Due soon task')).toBeInTheDocument();
    expect(screen.queryByText('Far out task')).not.toBeInTheDocument();
  });
});

describe('RecentActivity', () => {
  it('renders nothing given an empty task list', () => {
    const { container } = renderRecentActivity(<RecentActivity tasks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists tasks most-recently-touched first', () => {
    const older = buildTask({
      title: 'Older completion',
      status: 'COMPLETED',
      completed_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    });
    const newer = buildTask({
      title: 'Newer completion',
      status: 'COMPLETED',
      completed_at: new Date(Date.now() - 60_000).toISOString(),
    });
    renderRecentActivity(<RecentActivity tasks={[older, newer]} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Newer completion');
    expect(items[1]).toContain('Older completion');
  });
});
