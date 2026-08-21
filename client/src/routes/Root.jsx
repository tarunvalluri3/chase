import { useAuth } from '@clerk/clerk-react';
import Landing from './Landing';
import Home from './Home';
import { AppLayout } from '../layouts/AppLayout';
import { Skeleton } from '../components/ui/Skeleton';

// "/" is DESIGN.md §6's Home nav slot for a signed-in visitor and the
// marketing entry point for everyone else — resolved here rather than
// splitting into two routes so the nav table needs no rework. Home is
// wrapped in AppLayout directly (not via a nested Route/Outlet) since this
// component, not the router, decides whether the shell renders at all.
export default function Root() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }

  return isSignedIn ? (
    <AppLayout>
      <Home />
    </AppLayout>
  ) : (
    <Landing />
  );
}
