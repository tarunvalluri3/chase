import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { apiClient } from '../lib/apiClient';

// Authenticated placeholder for the Home nav slot (DESIGN.md §6). The real
// dashboard — counts, due soon, needs review, recent activity — is Phase 14.
// This phase only needs a real signed-in destination and a way to reach
// account/sign-out (Phase 11 gives it permanent nav placement).
export default function Home() {
  const { user } = useUser();
  const [health, setHealth] = useState('checking...');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/health')
      .then((data) => {
        if (!cancelled) setHealth(data?.status ?? 'ok');
      })
      .catch(() => {
        if (!cancelled) setHealth('unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col px-gutter pt-6">
      <div className="flex items-center justify-between">
        <img src="/brand/chase-mark-on-dark.svg" alt="Chase" className="h-7 w-7" />
        <Link
          to="/profile"
          className="rounded-(--radius-sm) text-body text-ink-2 transition-colors hover:text-ink"
        >
          Profile
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-meta text-ink-3">Welcome back</p>
        <h1 className="text-title text-ink">
          {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? 'Chase'}
        </h1>
        <p className="text-body text-ink-2">The dashboard lands in Phase 14.</p>
        <p className="text-meta text-ink-3">API: {health}</p>
      </div>
    </main>
  );
}
