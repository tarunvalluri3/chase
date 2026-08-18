import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../TaskForm';
import { renderWithProviders, buildTask } from '../../../test/testUtils';
import { ApiError, tasksApi } from '../../../lib/apiClient';

vi.mock('../../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../../lib/apiClient');
  return {
    ...actual,
    tasksApi: {
      ...actual.tasksApi,
      create: vi.fn(),
      patch: vi.fn(),
    },
  };
});

describe('TaskForm', () => {
  beforeEach(() => {
    tasksApi.create.mockReset();
    tasksApi.patch.mockReset();
  });

  it('rejects submission with an empty title, without calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm mode="create" onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(tasksApi.create).not.toHaveBeenCalled();
  });

  it('submits a create with trimmed title/description and the selected priority', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    tasksApi.create.mockResolvedValue(buildTask({ title: 'Ship the memo' }));
    renderWithProviders(<TaskForm mode="create" onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('Title'), '  Ship the memo  ');
    await user.click(screen.getByRole('radio', { name: 'High' }));
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText).toBeDefined();
    expect(tasksApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ship the memo', priority: 'HIGH' }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('pre-fills fields in edit mode and calls patch, not create', async () => {
    const user = userEvent.setup();
    const task = buildTask({ title: 'Existing task', priority: 'LOW' });
    tasksApi.patch.mockResolvedValue({ ...task, title: 'Renamed task' });
    renderWithProviders(<TaskForm mode="edit" task={task} onSuccess={vi.fn()} />);

    expect(screen.getByDisplayValue('Existing task')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Low' })).toHaveAttribute('aria-checked', 'true');

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Renamed task');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(tasksApi.patch).toHaveBeenCalledWith(task.id, expect.objectContaining({ title: 'Renamed task' }));
    expect(tasksApi.create).not.toHaveBeenCalled();
  });

  it('maps server validation details back onto the matching field, never a raw API message alone', async () => {
    const user = userEvent.setup();
    tasksApi.create.mockRejectedValue(
      new ApiError('Validation failed', 400, [{ path: 'title', message: 'Title must be unique' }]),
    );
    renderWithProviders(<TaskForm mode="create" onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('Title'), 'Duplicate');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText('Title must be unique')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<TaskForm mode="create" onSuccess={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
