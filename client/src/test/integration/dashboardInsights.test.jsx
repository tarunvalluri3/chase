import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, buildTask } from '../testUtils';
import { tasksApi, analyticsApi } from '../../lib/apiClient';
import Home from '../../routes/Home';
import Insights from '../../routes/Insights';

vi.mock('../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../lib/apiClient');
  return {
    ...actual,
    tasksApi: { ...actual.tasksApi, list: vi.fn() },
    analyticsApi: { ...actual.analyticsApi, summary: vi.fn() },
  };
});

const EMPTY_SUMMARY = {
  range: 'all',
  kpis: {
    totalTasks: 0,
    completedTasks: 0,
    missedUnresolvedTasks: 0,
    missedEverTasks: 0,
    deletedTasks: 0,
    completionRate: 0,
    missedRate: 0,
    deletionRate: 0,
    totalTrackedSeconds: 0,
  },
  completionTrend: [],
  missedTrend: [],
  incompleteTrend: [],
  deletedTrend: [],
  priorityBreakdown: [],
  deadlinePerformance: { onTime: 0, late: 0, total: 0 },
  incompleteReasons: [],
  deletedReasons: [],
  unresolvedMissed: [],
  timeTrackedTrend: [],
  timePerTask: [],
  timeVsOutcome: [],
  priorityTimeSpent: [],
};

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
  beforeEach(() => analyticsApi.summary.mockReset());

  it('shows the empty state when there is no history yet', async () => {
    analyticsApi.summary.mockResolvedValue(EMPTY_SUMMARY);
    renderWithProviders(<Insights />);
    expect(await screen.findByText('Nothing to show yet.')).toBeInTheDocument();
  });

  it('renders the charts and unresolved-missed section once there is history', async () => {
    analyticsApi.summary.mockResolvedValue({
      ...EMPTY_SUMMARY,
      kpis: { ...EMPTY_SUMMARY.kpis, totalTasks: 3, completedTasks: 1, missedUnresolvedTasks: 1, missedEverTasks: 1 },
      completionTrend: [{ week: '2026-08-10', label: 'Aug 10', onTime: 1, resolved: 0 }],
      unresolvedMissed: [{ id: 't-1', title: 'Needs a look', missed_at: new Date().toISOString() }],
      incompleteReasons: [{ reason: 'Ran out of time', count: 1 }],
    });
    renderWithProviders(<Insights />);
    expect(await screen.findByText('Needs review')).toBeInTheDocument();
    expect(screen.getByText('Completed over time')).toBeInTheDocument();
    expect(screen.getByText("Why tasks didn't get done")).toBeInTheDocument();
  });

  it('refetches with the selected range when the date-range filter changes', async () => {
    analyticsApi.summary.mockResolvedValue(EMPTY_SUMMARY);
    renderWithProviders(<Insights />);
    await screen.findByText('Nothing to show yet.');

    screen.getByRole('button', { name: '30 days' }).click();
    await screen.findByText('Nothing to show yet.');
    expect(analyticsApi.summary).toHaveBeenLastCalledWith('30d');
  });
});
