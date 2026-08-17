import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

// Placeholder route proving the scaffold renders and the API client can reach
// the backend. Real dashboard UI lands in Phase 14.
export default function Home() {
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-gutter text-center">
      <h1 className="text-title">Chase</h1>
      <p className="text-body text-ink-2">Frontend foundation is up.</p>
      <p className="text-meta text-ink-3">API: {health}</p>
    </main>
  );
}
