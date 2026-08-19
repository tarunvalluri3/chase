import { createContext, useCallback, useContext, useState } from 'react';
import { notificationsApi } from './apiClient';

// Shared state for the in-app notification feed's bell/badge (mirrors
// tasksStore.jsx's shape) -- the unread count needs to be visible from
// AppBar's trailing action on every authenticated screen, and the sheet
// itself is mounted once and toggled from here so any screen's bell opens
// the same sheet.
//
// Deliberately no fetch-on-mount here: this provider wraps the whole app,
// including the signed-out Landing/Login routes, so an unconditional fetch
// here would fire an unauthenticated request on every page load. AppLayout
// (authenticated-only) triggers the first refreshUnreadCount() call itself.
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const rows = await notificationsApi.list({ unreadOnly: true });
      setUnreadCount(rows.length);
    } catch {
      // The badge is decorative chrome, same posture as useTaskCounts -- a
      // failed background refresh just leaves the previous count in place.
    }
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const value = { unreadCount, sheetOpen, openSheet, closeSheet, refreshUnreadCount };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  return ctx;
}
