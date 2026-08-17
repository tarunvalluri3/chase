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
      <main className="flex min-h-dvh flex-col gap-3 px-gutter pt-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
