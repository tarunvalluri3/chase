import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/testUtils';
import Root from '../Root';

const mockUseAuth = vi.fn();
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockUseAuth(),
  useUser: () => ({ user: null }),
}));

vi.mock('../../lib/apiClient', async () => {
  const actual = await vi.importActual('../../lib/apiClient');
  return { ...actual, tasksApi: { ...actual.tasksApi, list: vi.fn().mockResolvedValue([]) } };
});

// "/" is the one route that resolves to two entirely different experiences
// depending on auth state (Root.jsx, not a route guard) — worth its own
// auth-flow coverage alongside ProtectedRoute's.
describe('Root ("/") auth-flow behavior', () => {
  it('renders the public Landing page when signed out', async () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderWithProviders(<Root />);
    expect(await screen.findAllByText(/Chase/i)).not.toHaveLength(0);
  });

  it('renders the authenticated Home dashboard shell when signed in', async () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    renderWithProviders(<Root />);
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });
});
