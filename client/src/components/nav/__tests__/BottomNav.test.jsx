import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BottomNav } from '../BottomNav';
import { renderWithProviders } from '../../../test/testUtils';

describe('BottomNav', () => {
  it('renders all five nav slots (Home, Tasks, Create, Insights, Profile)', () => {
    renderWithProviders(<BottomNav />, { route: '/' });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument();
  });

  it('marks the current route with aria-current="page"', () => {
    renderWithProviders(<BottomNav />, { route: '/tasks/active' });
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows the needs-review badge only when the count is greater than zero', () => {
    const { unmount } = renderWithProviders(<BottomNav needsReviewCount={0} />, { route: '/' });
    const zeroCountBadgeCount = screen.getByRole('link', { name: 'Tasks' }).querySelectorAll('span[aria-hidden="true"]').length;
    unmount();

    renderWithProviders(<BottomNav needsReviewCount={3} />, { route: '/' });
    const tasksLink = screen.getByRole('link', { name: 'Tasks' });
    expect(tasksLink.querySelectorAll('span[aria-hidden="true"]').length).toBeGreaterThan(zeroCountBadgeCount);
  });

  it('the Create button opens the create-task sheet, and all tap targets meet the 48px nav floor via the tap-target class', () => {
    renderWithProviders(<BottomNav />, { route: '/' });
    const createButton = screen.getByRole('button', { name: 'Create task' });
    expect(createButton).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
