import { useAuth } from '@clerk/clerk-react';
import Landing from './Landing';
import Home from './Home';
import { Skeleton } from '../components/ui/Skeleton';

// "/" is DESIGN.md §6's Home nav slot for a signed-in visitor and the
// marketing entry point for everyone else — resolved here rather than
// splitting into two routes so the nav table (Phase 11) needs no rework.
export default function Root() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="flex min-h-dvh flex-col gap-3 px-gutter pt-24">
        <Skeleton className="mx-auto h-8 w-2/3" />
        <Skeleton className="mx-auto h-4 w-1/2" />
        <Skeleton className="mx-auto mt-8 h-32 w-full max-w-sm" />
      </main>
    );
  }

  return isSignedIn ? <Home /> : <Landing />;
}
