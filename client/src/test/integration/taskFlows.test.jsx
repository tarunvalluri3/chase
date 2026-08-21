import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from '../../components/tasks/TaskList';
import { TaskDetail } from '../../components/tasks/TaskDetail';
import { BottomNav } from '../../components/nav/BottomNav';
import { Sidebar } from '../../components/nav/Sidebar';
import { CreateTaskSheet } from '../../components/tasks/CreateTaskSheet';
import { renderWithProviders, buildTask } from '../testUtils';
import { tasksApi } from '../../lib/apiClient';

// Integration-style tests against a mocked API layer (Phase 16 scope) —
// covers create/edit/complete/delete/resolve-both-ways/filter-by-status,
// exercised the way a real screen composes these components rather than
// unit-testing each in isolation again.
vi.mock('../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../lib/apiClient');
  return {
    ...actual,
    tasksApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      patch: vi.fn(),
      complete: vi.fn(),
      resolveMissed: vi.fn(),
      remove: vi.fn(),
    },
  };
});

describe('Create task flow', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it('opens the create sheet from the bottom nav, submits, and calls tasksApi.create', async () => {
    const user = userEvent.setup();
    tasksApi.create.mockResolvedValue(buildTask({ title: 'New task from nav' }));
    // CreateTaskSheet lives outside BottomNav (rendered once at the
    // AppLayout level, see AppLayout.jsx) so it isn't hidden by BottomNav's
    // own `min-[960px]:hidden` wrapper at the desktop breakpoint — composed
    // together here the same way AppLayout composes them in production.
    renderWithProviders(
      <>
        <BottomNav />
        <CreateTaskSheet />
      </>,
      { route: '/' },
    );

    await user.click(screen.getByRole('button', { name: 'Create task' }));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.type(within(dialog).getByLabelText('Title'), 'New task from nav');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(tasksApi.create).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the same create sheet from the desktop Sidebar (regression: it used to be unreachable at >=960px)', async () => {
    const user = userEvent.setup();
    tasksApi.create.mockResolvedValue(buildTask({ title: 'New task from sidebar' }));
    renderWithProviders(
      <>
        <Sidebar />
        <CreateTaskSheet />
      </>,
      { route: '/' },
    );

    await user.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.type(within(dialog).getByLabelText('Title'), 'New task from sidebar');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(tasksApi.create).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Edit task flow', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it('opens Edit on an ACTIVE task detail, changes the title, and calls tasksApi.patch', async () => {
    const user = userEvent.setup();
    const task = buildTask({ status: 'ACTIVE', title: 'Original title' });
    tasksApi.patch.mockResolvedValue({ ...task, title: 'Updated title' });
    const onTaskUpdated = vi.fn();
    renderWithProviders(<TaskDetail task={task} onTaskUpdated={onTaskUpdated} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const titleInput = await screen.findByDisplayValue('Original title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(tasksApi.patch).toHaveBeenCalledWith(task.id, expect.objectContaining({ title: 'Updated title' })));
  });
});

describe('Complete task flow', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it('completing an ACTIVE card removes it from the list once the server confirms', async () => {
    const user = userEvent.setup();
    const task = buildTask({ status: 'ACTIVE', title: 'Finish the memo' });
    // First call is the initial load; the refetch triggered after Complete
    // mirrors a real GET ?status=ACTIVE no longer including the task.
    tasksApi.list.mockResolvedValueOnce([task]).mockResolvedValue([]);
    tasksApi.complete.mockResolvedValue({ ...task, status: 'COMPLETED' });

    renderWithProviders(<TaskList status="active" emptyTitle="empty" emptyDescription="none" />);
    expect(await screen.findByText('Finish the memo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete this task?' });
    await user.click(within(dialog).getByRole('button', { name: 'Complete' }));

    await waitFor(() => expect(tasksApi.complete).toHaveBeenCalledWith(task.id));
    await waitFor(() => expect(screen.queryByText('Finish the memo')).not.toBeInTheDocument(), { timeout: 3000 });
  });
});

describe('Delete task flow', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it('deleting an ACTIVE card requires a reason and removes it once confirmed', async () => {
    const user = userEvent.setup();
    const task = buildTask({ status: 'ACTIVE', title: 'Stale task' });
    // First call is the initial load; the refetch triggered after Delete
    // mirrors a real GET ?status=ACTIVE no longer including the task.
    tasksApi.list.mockResolvedValueOnce([task]).mockResolvedValue([]);
    tasksApi.remove.mockResolvedValue({ ...task, status: 'DELETED' });

    renderWithProviders(<TaskList status="active" emptyTitle="empty" emptyDescription="none" />);
    expect(await screen.findByText('Stale task')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.type(screen.getByLabelText('Why are you deleting this?'), 'No longer needed');
    await user.click(screen.getByRole('button', { name: 'Delete task' }));

    await waitFor(() => expect(tasksApi.remove).toHaveBeenCalledWith(task.id, 'No longer needed'));
    await waitFor(() => expect(screen.queryByText('Stale task')).not.toBeInTheDocument());
  });
});

describe('Resolve MISSED task flow', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it('resolves MISSED -> COMPLETED with no reason required', async () => {
    const user = userEvent.setup();
    const task = buildTask({ status: 'MISSED', title: 'Overdue report' });
    // First call is the initial load; the refetch triggered after resolving
    // mirrors a real GET ?status=MISSED no longer including the task.
    tasksApi.list.mockResolvedValueOnce([task]).mockResolvedValue([]);
    tasksApi.resolveMissed.mockResolvedValue({ ...task, status: 'COMPLETED' });

    renderWithProviders(<TaskList status="missed" emptyTitle="empty" emptyDescription="none" />);
    expect(await screen.findByText('Overdue report')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    await user.click(screen.getByRole('radio', { name: 'I completed this' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(tasksApi.resolveMissed).toHaveBeenCalledWith(task.id, { resolution: 'COMPLETED' }));
    await waitFor(() => expect(screen.queryByText('Overdue report')).not.toBeInTheDocument(), { timeout: 3000 });
  });

  it('resolves MISSED -> INCOMPLETE and requires a non-empty reason', async () => {
    const user = userEvent.setup();
    const task = buildTask({ status: 'MISSED', title: 'Dropped ball' });
    tasksApi.list.mockResolvedValue([task]);
    tasksApi.resolveMissed.mockResolvedValue({ ...task, status: 'INCOMPLETE' });

    renderWithProviders(<TaskList status="missed" emptyTitle="empty" emptyDescription="none" />);
    expect(await screen.findByText('Dropped ball')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    await user.click(screen.getByRole('radio', { name: "I didn't complete this" }));
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await user.type(screen.getByLabelText('What got in the way?'), 'Blocked on legal review');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(tasksApi.resolveMissed).toHaveBeenCalledWith(task.id, {
        resolution: 'INCOMPLETE',
        reason: 'Blocked on legal review',
      }),
    );
  });
});

describe('Filter by status', () => {
  beforeEach(() => {
    Object.values(tasksApi).forEach((fn) => fn.mockReset?.());
  });

  it.each([
    ['active', 'ACTIVE'],
    ['missed', 'MISSED'],
    ['completed', 'COMPLETED'],
    ['incomplete', 'INCOMPLETE'],
    ['deleted', 'DELETED'],
  ])('TaskList for the %s section requests ?status=%s', async (routeStatus) => {
    tasksApi.list.mockResolvedValue([]);
    renderWithProviders(<TaskList status={routeStatus} emptyTitle="Nothing here" emptyDescription="none" />);
    await waitFor(() => expect(tasksApi.list).toHaveBeenCalledWith(routeStatus));
  });
});
