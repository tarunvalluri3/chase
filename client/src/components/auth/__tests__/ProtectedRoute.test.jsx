import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderProtected(initialPath = '/profile') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Protected profile content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute (auth-flow)', () => {
  it('shows a skeleton, not the route or a redirect, while Clerk is still resolving', () => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    renderProtected();
    expect(screen.queryByText('Protected profile content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects to /login when the user is signed out', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderProtected();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected profile content')).not.toBeInTheDocument();
  });

  it('renders the protected route content when the user is signed in', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    renderProtected();
    expect(screen.getByText('Protected profile content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
