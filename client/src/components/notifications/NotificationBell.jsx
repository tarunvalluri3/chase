import { forwardRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationsContext } from '../../lib/notificationsStore';

// AppBar's trailing-action slot (DESIGN.md §6.2: "at most one trailing
// action"), shown on every authenticated screen since unread notifications
// can arrive regardless of which tab is open. Badge styling matches
// BottomNav's amber needs-review dot rather than inventing a new treatment.
export const NotificationBell = forwardRef(function NotificationBell(_props, ref) {
  const { unreadCount, openSheet } = useNotificationsContext();

  return (
    <button
      ref={ref}
      type="button"
      onClick={openSheet}
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative flex h-11 w-11 items-center justify-center rounded-(--radius-sm) text-ink-2 hover:text-ink"
    >
      <Bell size={24} strokeWidth={1.8} aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-(--radius-pill)"
          style={{ backgroundColor: 'var(--color-review)' }}
        />
      )}
    </button>
  );
});
