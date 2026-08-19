import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeTracker } from '../TimeTracker';
import { renderWithProviders } from '../../../test/testUtils';
import { sessionsApi } from '../../../lib/apiClient';

vi.mock('../../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../../lib/apiClient');
  return {
    ...actual,
    sessionsApi: {
      list: vi.fn(),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
    },
  };
});

const TASK_ID = 'task-timer-1';

function segment(overrides = {}) {
  return {
    id: `seg-${Math.random()}`,
    task_id: TASK_ID,
    started_at: new Date(Date.now() - 5000).toISOString(),
    ended_at: null,
    end_reason: null,
    ...overrides,
  };
}

describe('TimeTracker', () => {
  beforeEach(() => {
    sessionsApi.list.mockReset();
    sessionsApi.start.mockReset();
    sessionsApi.pause.mockReset();
    sessionsApi.resume.mockReset();
    sessionsApi.stop.mockReset();
  });

  it('shows a Start control and no elapsed time when there is no session history', async () => {
    sessionsApi.list.mockResolvedValue([]);
    renderWithProviders(<TimeTracker taskId={TASK_ID} />);

    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.queryByText(/^\d+:\d{2}$/)).not.toBeInTheDocument();
  });

  it('starting a session calls the API with the task id and switches to Pause/Stop', async () => {
    const user = userEvent.setup();
    sessionsApi.list.mockResolvedValueOnce([]).mockResolvedValueOnce([segment()]);
    sessionsApi.start.mockResolvedValue(segment());
    renderWithProviders(<TimeTracker taskId={TASK_ID} />);

    await user.click(await screen.findByRole('button', { name: 'Start' }));

    expect(sessionsApi.start).toHaveBeenCalledWith(TASK_ID);
    expect(await screen.findByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('a paused session (most recent segment ended PAUSED) shows Resume, not Start', async () => {
    sessionsApi.list.mockResolvedValue([
      segment({ ended_at: new Date().toISOString(), end_reason: 'PAUSED' }),
    ]);
    renderWithProviders(<TimeTracker taskId={TASK_ID} />);

    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });

  it('pausing calls the API and returns to a Resume-able state', async () => {
    const user = userEvent.setup();
    sessionsApi.list
      .mockResolvedValueOnce([segment()])
      .mockResolvedValueOnce([segment({ ended_at: new Date().toISOString(), end_reason: 'PAUSED' })]);
    sessionsApi.pause.mockResolvedValue(segment({ end_reason: 'PAUSED' }));
    renderWithProviders(<TimeTracker taskId={TASK_ID} />);

    await user.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(sessionsApi.pause).toHaveBeenCalledWith(TASK_ID);
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('stopping a session leaves it startable again', async () => {
    const user = userEvent.setup();
    sessionsApi.list
      .mockResolvedValueOnce([segment()])
      .mockResolvedValueOnce([segment({ ended_at: new Date().toISOString(), end_reason: 'STOPPED' })]);
    sessionsApi.stop.mockResolvedValue(segment({ end_reason: 'STOPPED' }));
    renderWithProviders(<TimeTracker taskId={TASK_ID} />);

    await user.click(await screen.findByRole('button', { name: 'Stop' }));

    expect(sessionsApi.stop).toHaveBeenCalledWith(TASK_ID);
    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('compact mode renders icon-only buttons with an accessible label', async () => {
    sessionsApi.list.mockResolvedValue([]);
    renderWithProviders(<TimeTracker taskId={TASK_ID} compact />);

    const startButton = await screen.findByRole('button', { name: 'Start work session' });
    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toHaveTextContent('Start');
  });

  it('readOnly with no tracked time renders nothing', async () => {
    sessionsApi.list.mockResolvedValue([]);
    const { container } = renderWithProviders(<TimeTracker taskId={TASK_ID} readOnly />);

    await waitFor(() => expect(sessionsApi.list).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('readOnly with tracked history shows the total but no action buttons', async () => {
    const startedAt = new Date(Date.now() - 60_000).toISOString();
    const endedAt = new Date().toISOString();
    sessionsApi.list.mockResolvedValue([segment({ started_at: startedAt, ended_at: endedAt, end_reason: 'AUTO_STOPPED' })]);
    renderWithProviders(<TimeTracker taskId={TASK_ID} readOnly />);

    expect(await screen.findByText('1:00')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
