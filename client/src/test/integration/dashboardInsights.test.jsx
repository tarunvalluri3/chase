import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, buildTask } from '../testUtils';
import { tasksApi } from '../../lib/apiClient';
import Home from '../../routes/Home';
import Insights from '../../routes/Insights';

vi.mock('../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../lib/apiClient');
  return { ...actual, tasksApi: { ...actual.tasksApi, list: vi.fn() } };
});

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { firstName: 'Rajni', primaryEmailAddress: { emailAddress: 'rajni@example.com' } } }),
}));

describe('Dashboard view (Home)', () => {
  beforeEach(() => tasksApi.list.mockReset());

  it('shows the empty state when there are no tasks at all', async () => {
    tasksApi.list.mockResolvedValue([]);
    renderWithProviders(<Home />);
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('shows status counts, due-soon, and recent activity once tasks load', async () => {
    tasksApi.list.mockResolvedValue([
      buildTask({ status: 'ACTIVE', title: 'Due soon task', deadline: new Date(Date.now() + 3600_000).toISOString() }),
      buildTask({ status: 'COMPLETED', title: 'Done task', completed_at: new Date().toISOString() }),
    ]);
    renderWithProviders(<Home />);
    expect(await screen.findByText('Welcome back, Rajni.')).toBeInTheDocument();
    expect(screen.getByText('Due soon')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
  });

  it('shows the mapped error state (never a raw API message) and a working Retry', async () => {
    tasksApi.list.mockRejectedValueOnce(new Error('boom'));
    renderWithProviders(<Home />);
    expect(await screen.findByText("Couldn't load your tasks.")).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();

    tasksApi.list.mockResolvedValueOnce([]);
    await screen.getByRole('button', { name: 'Retry' }).click();
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });
});

describe('Insights view', () => {
  beforeEach(() => tasksApi.list.mockReset());

  it('shows the empty state when there is no history yet', async () => {
    tasksApi.list.mockResolvedValue([]);
    renderWithProviders(<Insights />);
    expect(await screen.findByText('Nothing to show yet.')).toBeInTheDocument();
  });

  it('renders the charts and unresolved-missed section once there is history', async () => {
    tasksApi.list.mockResolvedValue([
      buildTask({ status: 'COMPLETED', completed_at: new Date().toISOString() }),
      buildTask({ status: 'MISSED', missed_at: new Date().toISOString() }),
      buildTask({ status: 'INCOMPLETE', incomplete_reason: 'Ran out of time', incomplete_at: new Date().toISOString() }),
    ]);
    renderWithProviders(<Insights />);
    expect(await screen.findByText('Needs review')).toBeInTheDocument();
    expect(screen.getByText('Completed over time')).toBeInTheDocument();
    expect(screen.getByText("Why tasks didn't get done")).toBeInTheDocument();
  });
});
