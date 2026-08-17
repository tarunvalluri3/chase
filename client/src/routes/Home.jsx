import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiClient } from '../lib/apiClient';

// Authenticated placeholder for the Home nav slot (DESIGN.md §6), rendered
// inside AppLayout (Phase 11) — AppBar/BottomNav are now permanent chrome,
// so this only needs its own content. The real dashboard — counts, due soon,
// needs review, recent activity — is Phase 14.
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
    <div className="flex flex-col items-center gap-2 px-gutter pt-16 text-center">
      <p className="text-meta text-ink-3">Welcome back</p>
      <h2 className="text-title text-ink">
        {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? 'Chase'}
      </h2>
      <p className="text-body text-ink-2">The dashboard lands in Phase 14.</p>
      <p className="text-meta text-ink-3">API: {health}</p>
    </div>
  );
}
