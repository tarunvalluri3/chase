import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/testUtils';
import { NotificationsBanner } from '../NotificationsBanner';
import { NotificationsSettingsRow } from '../NotificationsSettingsRow';

vi.mock('../../../lib/pushClient', () => ({
  isPushSupported: vi.fn(() => true),
  getPushPermissionState: vi.fn(() => 'default'),
  isSubscribed: vi.fn(async () => false),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

import * as pushClient from '../../../lib/pushClient';

const DISMISSED_KEY = 'chase.notificationsBannerDismissed';

beforeEach(() => {
  vi.clearAllMocks();
  pushClient.isPushSupported.mockReturnValue(true);
  pushClient.getPushPermissionState.mockReturnValue('default');
  pushClient.isSubscribed.mockResolvedValue(false);
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('NotificationsBanner', () => {
  it('renders when push is supported and permission is still undecided', () => {
    renderWithProviders(<NotificationsBanner />);
    expect(screen.getByText('Get notified even when Chase is closed')).toBeInTheDocument();
  });

  it('does not render when push is unsupported', () => {
    pushClient.isPushSupported.mockReturnValue(false);
    renderWithProviders(<NotificationsBanner />);
    expect(screen.queryByText('Get notified even when Chase is closed')).not.toBeInTheDocument();
  });

  it('does not render again once previously dismissed on this device', () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    renderWithProviders(<NotificationsBanner />);
    expect(screen.queryByText('Get notified even when Chase is closed')).not.toBeInTheDocument();
  });

  it('subscribes and dismisses itself when Enable is clicked', async () => {
    pushClient.subscribeToPush.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBanner />);

    await user.click(screen.getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(pushClient.subscribeToPush).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByText('Get notified even when Chase is closed')).not.toBeInTheDocument(),
    );
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('true');
  });

  it('dismisses without subscribing when "Not now" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsBanner />);

    await user.click(screen.getByRole('button', { name: 'Not now' }));

    expect(pushClient.subscribeToPush).not.toHaveBeenCalled();
    expect(screen.queryByText('Get notified even when Chase is closed')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('true');
  });
});

describe('NotificationsSettingsRow', () => {
  it('shows "Off" when supported but not yet subscribed', async () => {
    pushClient.isSubscribed.mockResolvedValue(false);
    renderWithProviders(<NotificationsSettingsRow />);
    expect(await screen.findByText('Off')).toBeInTheDocument();
  });

  it('shows "On" when already subscribed', async () => {
    pushClient.isSubscribed.mockResolvedValue(true);
    renderWithProviders(<NotificationsSettingsRow />);
    expect(await screen.findByText('On')).toBeInTheDocument();
  });

  it('shows "Blocked" and is disabled when the OS permission was denied', async () => {
    pushClient.getPushPermissionState.mockReturnValue('denied');
    renderWithProviders(<NotificationsSettingsRow />);
    expect(await screen.findByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Notifications').closest('span[aria-disabled]')).toBeInTheDocument();
  });

  it('shows "Not supported" when push is unavailable in this browser', async () => {
    pushClient.isPushSupported.mockReturnValue(false);
    renderWithProviders(<NotificationsSettingsRow />);
    expect(await screen.findByText('Not supported')).toBeInTheDocument();
  });

  it('subscribes when toggled off -> on', async () => {
    pushClient.isSubscribed.mockResolvedValue(false);
    pushClient.subscribeToPush.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<NotificationsSettingsRow />);

    await user.click(await screen.findByRole('button', { name: /Notifications/ }));

    await waitFor(() => expect(pushClient.subscribeToPush).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('On')).toBeInTheDocument();
  });

  it('unsubscribes when toggled on -> off', async () => {
    pushClient.isSubscribed.mockResolvedValue(true);
    pushClient.unsubscribeFromPush.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<NotificationsSettingsRow />);

    await user.click(await screen.findByRole('button', { name: /Notifications/ }));

    await waitFor(() => expect(pushClient.unsubscribeFromPush).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Off')).toBeInTheDocument();
  });
});
