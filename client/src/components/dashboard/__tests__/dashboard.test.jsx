import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatTile } from '../StatTile';
import { StatusCounts } from '../StatusCounts';
import { DueSoon } from '../DueSoon';
import { RecentActivity } from '../RecentActivity';
import { buildTask } from '../../../test/testUtils';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('StatTile', () => {
  it('renders the count and label with the given color', () => {
    render(<StatTile label="Active" count={5} color="var(--color-active)" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveStyle({ color: 'var(--color-active)' });
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
    const { container } = renderWithRouter(<RecentActivity tasks={[]} />);
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
    renderWithRouter(<RecentActivity tasks={[older, newer]} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Newer completion');
    expect(items[1]).toContain('Older completion');
  });
});
