import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineBar } from '../OfflineBar';

function setOnline(value) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
}

describe('OfflineBar (DESIGN.md §9 offline checklist item)', () => {
  afterEach(() => setOnline(true));

  it('renders nothing while online', () => {
    setOnline(true);
    const { container } = render(<OfflineBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the verbatim copy when the browser goes offline', () => {
    setOnline(false);
    render(<OfflineBar />);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByText("You're offline. Changes will fail until you reconnect.")).toBeInTheDocument();
  });

  it('is dismissible', async () => {
    setOnline(false);
    const user = userEvent.setup();
    render(<OfflineBar />);
    act(() => window.dispatchEvent(new Event('offline')));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText("You're offline. Changes will fail until you reconnect.")).not.toBeInTheDocument();
  });
});
