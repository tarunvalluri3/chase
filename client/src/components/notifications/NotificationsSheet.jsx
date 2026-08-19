import { Link } from 'react-router-dom';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { formatTimestamp } from '../../lib/datetime';
import { notificationsApi } from '../../lib/apiClient';
import { useNotificationsContext } from '../../lib/notificationsStore';
import { useNotificationsFeed } from '../../hooks/useNotificationsFeed';

// Which task-list section a notification's task most likely still lives in
// -- best-effort routing, not authoritative (the task may have moved on
// again since); TaskDetailPage resolves the real task regardless of which
// status segment got us there.
const STATUS_ROUTE = {
  TASK_CREATED: 'active',
  TASK_UPDATED: 'active',
  TASK_COMPLETED: 'completed',
  TASK_INCOMPLETE: 'incomplete',
  TASK_DELETED: 'deleted',
  TASK_MISSED: 'missed',
  DEADLINE_REMINDER: 'active',
};

// Mounted once in AppLayout (like ToastViewport), driven entirely by
// NotificationsContext so any screen's bell opens the same sheet.
export function NotificationsSheet({ triggerRef }) {
  const { sheetOpen, closeSheet, refreshUnreadCount } = useNotificationsContext();
  const { status, notifications, reload } = useNotificationsFeed(sheetOpen);

  async function markRead(id) {
    try {
      await notificationsApi.markRead(id);
      reload();
      refreshUnreadCount();
    } catch {
      // Best-effort -- the row just stays visually unread if this fails.
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      reload();
      refreshUnreadCount();
    } catch {
      // Best-effort, same as markRead above.
    }
  }

  const hasUnread = notifications.some((notification) => !notification.read_at);

  return (
    <Sheet open={sheetOpen} onClose={closeSheet} title="Notifications" returnFocusRef={triggerRef}>
      {hasUnread && (
        <div className="mb-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>
      )}

      {status === 'loading' && notifications.length === 0 && (
        <p className="py-10 text-center text-meta text-ink-3">Loading…</p>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-body text-ink-2">Couldn't load your notifications.</p>
          <Button size="sm" variant="secondary" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      {status === 'loaded' && notifications.length === 0 && (
        <p className="py-10 text-center text-body text-ink-3">Nothing yet. Task updates will show up here.</p>
      )}

      {notifications.length > 0 && (
        <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--color-rule)' }}>
          {notifications.map((notification) => (
            <li key={notification.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--color-rule)' }}>
              <Link
                to={`/tasks/${STATUS_ROUTE[notification.type] ?? 'active'}/${notification.task_id}`}
                onClick={() => {
                  closeSheet();
                  if (!notification.read_at) markRead(notification.id);
                }}
                className="flex flex-col gap-0.5 py-3"
              >
                <span
                  className="flex items-center gap-2 text-body"
                  style={{ color: notification.read_at ? 'var(--color-ink-3)' : 'var(--color-ink)' }}
                >
                  {!notification.read_at && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-(--radius-pill)"
                      style={{ backgroundColor: 'var(--color-review)' }}
                    />
                  )}
                  {notification.title}
                </span>
                <span className="text-meta text-ink-3">{notification.body}</span>
                <span className="text-micro text-ink-3">{formatTimestamp(notification.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
