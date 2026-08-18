import { useEffect, useState } from 'react';

// DESIGN.md §9 "Offline" — a real online/offline signal, not a stub. Falls
// back to true when navigator.onLine is unavailable (SSR/older browsers)
// rather than showing a false offline bar.
export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    function goOnline() {
      setOnline(true);
    }
    function goOffline() {
      setOnline(false);
    }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
