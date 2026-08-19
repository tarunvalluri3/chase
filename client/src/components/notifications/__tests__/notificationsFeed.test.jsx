import { useEffect, useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/testUtils';
import { NotificationBell } from '../NotificationBell';
import { NotificationsSheet } from '../NotificationsSheet';
import { useNotificationsContext } from '../../../lib/notificationsStore';

vi.mock('../../../lib/apiClient', () => ({
  notificationsApi: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

import { notificationsApi } from '../../../lib/apiClient';

function buildNotification(overrides = {}) {
  return {
    id: 'n-1',
    task_id: 'task-1',
    type: 'TASK_COMPLETED',
    title: 'Completed: Ship it',
    body: 'Nice work.',
    read_at: null,
    created_at: '2026-08-19T10:00:00.000Z',
    ...overrides,
  };
}

// Mirrors AppLayout's wiring: a shared ref between the bell (trigger) and
// the sheet, plus an initial refreshUnreadCount() call the way AppLayout
// triggers it on mount.
function BellAndSheet() {
  const ref = useRef(null);
  const { refreshUnreadCount } = useNotificationsContext();
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);
  return (
    <>
      <NotificationBell ref={ref} />
      <NotificationsSheet triggerRef={ref} />
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationBell badge', () => {
  it('shows no badge when there are no unread notifications', async () => {
    notificationsApi.list.mockResolvedValue([]);
    renderWithProviders(<BellAndSheet />);

    await waitFor(() => expect(notificationsApi.list).toHaveBeenCalledWith({ unreadOnly: true }));
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows the unread count in its accessible label when there are unread notifications', async () => {
    notificationsApi.list.mockResolvedValue([buildNotification()]);
    renderWithProviders(<BellAndSheet />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument(),
    );
  });
});

describe('NotificationsSheet', () => {
  it('lists notifications and shows the empty state when there are none', async () => {
    notificationsApi.list.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<BellAndSheet />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('Nothing yet. Task updates will show up here.')).toBeInTheDocument();
  });

  it('renders each notification with its title and body', async () => {
    notificationsApi.list.mockResolvedValue([
      buildNotification(),
      buildNotification({
        id: 'n-2',
        title: 'Needs review: Ship it',
        body: 'Open the task to confirm.',
        read_at: '2026-08-19T11:00:00.000Z',
      }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<BellAndSheet />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('Completed: Ship it')).toBeInTheDocument();
    expect(screen.getByText('Needs review: Ship it')).toBeInTheDocument();
    expect(screen.getByText('Nice work.')).toBeInTheDocument();
    expect(screen.getByText('Open the task to confirm.')).toBeInTheDocument();
  });

  it('marks a notification read when clicked', async () => {
    notificationsApi.list.mockResolvedValue([buildNotification()]);
    notificationsApi.markRead.mockResolvedValue(buildNotification({ read_at: '2026-08-19T12:00:00.000Z' }));
    const user = userEvent.setup();
    renderWithProviders(<BellAndSheet />, { route: '/' });

    await user.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }));
    await user.click(await screen.findByText('Completed: Ship it'));

    expect(notificationsApi.markRead).toHaveBeenCalledWith('n-1');
  });

  it('offers "Mark all read" only when something is unread, and calls the API', async () => {
    notificationsApi.list.mockResolvedValue([buildNotification()]);
    notificationsApi.markAllRead.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<BellAndSheet />);

    await user.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }));
    const markAllButton = await screen.findByRole('button', { name: 'Mark all read' });

    await user.click(markAllButton);
    expect(notificationsApi.markAllRead).toHaveBeenCalledTimes(1);
  });
});
