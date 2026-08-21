import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Skeleton } from '../ui/Skeleton';

// Gates authenticated-only routes. While Clerk resolves session state, renders
// a skeleton instead of the real content or a redirect, so neither an
// unauthenticated flash nor a login-page flash is possible (Phase 10
// acceptance: "No flash of protected content before auth state resolves").
export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <main>
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
