import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/nav/AppBar';
import { BottomNav } from '../components/nav/BottomNav';
import { Sidebar } from '../components/nav/Sidebar';
import { FilterRow } from '../components/nav/FilterRow';
import { ToastViewport } from '../components/ui/Toast';
import { OfflineBar } from '../components/ui/OfflineBar';
import { CreateTaskSheet } from '../components/tasks/CreateTaskSheet';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { NotificationsSheet } from '../components/notifications/NotificationsSheet';
import { formatTodayContext } from '../lib/datetime';
import { useTaskCounts } from '../hooks/useTaskCounts';
import { useNotificationsContext } from '../lib/notificationsStore';

const STATUS_CONTEXT = {
  active: 'ACTIVE',
  missed: 'NEEDS REVIEW',
  completed: 'COMPLETED',
  incomplete: 'NOT DONE',
  deleted: 'DELETED',
};

// The main authenticated shell (DESIGN.md §6): AppBar + routed content +
// always-visible BottomNav. Used two ways — as a layout route wrapping the
// Tasks/Insights/Profile Outlet, and directly with `children` wrapping Home
// at "/" (Root.jsx resolves Landing vs. Home before a route match exists).
//
// Phase 12: real per-status counts (useTaskCounts) replace the Phase 11
// stubs for FilterRow's pill numbers and BottomNav's needs-review badge.
// Task detail is a third `/tasks/:status/:id` shape nested under the same
// layout — it gets the back chevron (not a tab root) and no FilterRow.
export function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const counts = useTaskCounts();
  const { refreshUnreadCount } = useNotificationsContext();
  const bellRef = useRef(null);

  // AppLayout only ever renders for a signed-in user (Root/ProtectedRoute
  // gate everything above it), so this is the one safe place to trigger the
  // feed's first unread-count fetch -- see notificationsStore.jsx's note on
  // why NotificationsProvider itself doesn't fetch on mount.
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const segments = location.pathname.split('/').filter(Boolean);
  const isTasksRoute = segments[0] === 'tasks';
  const status = isTasksRoute ? segments[1] : undefined;
  const isTasksList = isTasksRoute && segments.length === 2;
  const isTaskDetail = isTasksRoute && segments.length === 3;

  const { title, context } = sectionMeta(location.pathname, status, isTaskDetail);

  return (
    <div>
      <Sidebar needsReviewCount={counts.missed ?? 0} />

      <div>
        <div>
          <AppBar
            title={title}
            context={context}
            onBack={isTaskDetail ? () => navigate(`/tasks/${status}`) : undefined}
            action={<NotificationBell ref={bellRef} />}
          />
          {isTasksList && <FilterRow selected={status} counts={counts} />}
        </div>

        <main>
          <div>
            <div key={location.pathname}>{children ?? <Outlet />}</div>
          </div>
        </main>

        <div>
          <BottomNav needsReviewCount={counts.missed ?? 0} />
        </div>
      </div>
      <OfflineBar />
      <ToastViewport />
      <CreateTaskSheet />
      <NotificationsSheet triggerRef={bellRef} />
    </div>
  );
}

function sectionMeta(pathname, status, isTaskDetail) {
  if (pathname === '/') {
    return { title: 'Home', context: formatTodayContext() };
  }
  if (pathname.startsWith('/tasks')) {
    if (isTaskDetail) {
      return { title: 'Task', context: STATUS_CONTEXT[status] ?? '' };
    }
    return { title: 'Tasks', context: STATUS_CONTEXT[status] ?? '' };
  }
  if (pathname.startsWith('/insights')) {
    return { title: 'Insights', context: 'PATTERNS' };
  }
  if (pathname.startsWith('/profile')) {
    return { title: 'Profile', context: 'ACCOUNT' };
  }
  return { title: '', context: '' };
}
