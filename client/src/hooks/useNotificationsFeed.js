import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../lib/apiClient';

// Refetches the full feed each time the sheet opens -- no polling, per
// PHASE_18.md §6 ("the feed refreshes on sheet-open... opening the sheet
// already re-fetches").
export function useNotificationsFeed(open) {
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const rows = await notificationsApi.list();
      setNotifications(rows);
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return { status, notifications, reload: load };
}
