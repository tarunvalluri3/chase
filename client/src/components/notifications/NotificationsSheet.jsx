import { useMemo, useState } from 'react';
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

// Every backend-emitted type is either a task lifecycle event or a
// deadline reminder -- there's no SYSTEM-originated type today, but the
// tab is real (not decorative) and will simply stay empty until one exists.
function feedCategory(type) {
  if (type === 'DEADLINE_REMINDER') return 'reminders';
  if (type?.startsWith('TASK_')) return 'tasks';
  return 'system';
}

const FEED_TABS = [
  { key: 'all', label: 'All' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'system', label: 'System' },
];

// Mounted once in AppLayout (like ToastViewport), driven entirely by
// NotificationsContext so any screen's bell opens the same sheet.
export function NotificationsSheet({ triggerRef }) {
  const { sheetOpen, closeSheet, refreshUnreadCount } = useNotificationsContext();
  const { status, notifications, reload } = useNotificationsFeed(sheetOpen);
  const [activeTab, setActiveTab] = useState('all');

  const tabCounts = useMemo(() => {
    const counts = { all: notifications.length, tasks: 0, reminders: 0, system: 0 };
    for (const notification of notifications) counts[feedCategory(notification.type)] += 1;
    return counts;
  }, [notifications]);

  const visibleNotifications = useMemo(
    () =>
      activeTab === 'all'
        ? notifications
        : notifications.filter((notification) => feedCategory(notification.type) === activeTab),
    [notifications, activeTab],
  );

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
      <div>
        <div>
          {FEED_TABS.map((tab) => {
            const isSelected = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span>{tabCounts[tab.key]}</span>
              </button>
            );
          })}
        </div>
        {hasUnread && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {status === 'loading' && notifications.length === 0 && <p>Loading…</p>}

      {status === 'error' && (
        <div>
          <p>Couldn't load your notifications.</p>
          <Button size="sm" variant="secondary" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      {status === 'loaded' && notifications.length === 0 && (
        <p>Nothing yet. Task updates will show up here.</p>
      )}

      {status === 'loaded' && notifications.length > 0 && visibleNotifications.length === 0 && (
        <p>Nothing in this tab yet.</p>
      )}

      {visibleNotifications.length > 0 && (
        <ul>
          {visibleNotifications.map((notification) => (
            <li key={notification.id}>
              <Link
                to={`/tasks/${STATUS_ROUTE[notification.type] ?? 'active'}/${notification.task_id}`}
                onClick={() => {
                  closeSheet();
                  if (!notification.read_at) markRead(notification.id);
                }}
              >
                <span>
                  {!notification.read_at && <span aria-hidden="true" />}
                  {notification.title}
                </span>
                <span>{notification.body}</span>
                <span>{formatTimestamp(notification.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
