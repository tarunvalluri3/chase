import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListChecks, Plus, BarChart3, User } from 'lucide-react';
import { SHEET_SPRING } from '../../lib/motion';
import { Sheet } from '../ui/Sheet';
import { TaskForm } from '../tasks/TaskForm';
import { useTasksContext } from '../../lib/tasksStore';

// DESIGN.md §6.1 — five slots, safe-area padding, `layoutId` pill, raised
// Create action opening a sheet, amber needs-review dot. Always visible;
// it disappears only when a sheet or the keyboard is open (handled by the
// sheet itself sitting above it, and by callers not rendering this inside
// a keyboard-visible context).
const TABS = [
  { key: 'home', label: 'Home', to: '/', icon: Home, isActive: (path) => path === '/' },
  {
    key: 'tasks',
    label: 'Tasks',
    to: '/tasks/active',
    icon: ListChecks,
    isActive: (path) => path.startsWith('/tasks'),
  },
  {
    key: 'insights',
    label: 'Insights',
    to: '/insights',
    icon: BarChart3,
    isActive: (path) => path.startsWith('/insights'),
  },
  { key: 'profile', label: 'Profile', to: '/profile', icon: User, isActive: (path) => path.startsWith('/profile') },
];

// needsReviewCount comes from AppLayout's real useTaskCounts() (Phase 12) —
// the badge itself was fully built in Phase 11, stubbed at zero until now.
export function BottomNav({ needsReviewCount = 0 }) {
  const { pathname } = useLocation();
  const createButtonRef = useRef(null);
  const { createSheetOpen, openCreateSheet, closeCreateSheet, refreshTasks } = useTasksContext();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-(--border-hairline) pb-safe"
        style={{
          backgroundColor: 'rgba(13,13,13,.86)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
          <NavTab tab={TABS[0]} active={TABS[0].isActive(pathname)} />
          <NavTab tab={TABS[1]} active={TABS[1].isActive(pathname)} badge={needsReviewCount > 0} />

          <button
            ref={createButtonRef}
            type="button"
            onClick={openCreateSheet}
            aria-haspopup="dialog"
            aria-expanded={createSheetOpen}
            aria-label="Create task"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-md) bg-accent-press text-canvas transition-colors hover:brightness-110"
          >
            <Plus size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <NavTab tab={TABS[2]} active={TABS[2].isActive(pathname)} />
          <NavTab tab={TABS[3]} active={TABS[3].isActive(pathname)} />
        </div>
      </nav>

      <Sheet open={createSheetOpen} onClose={closeCreateSheet} title="New task" returnFocusRef={createButtonRef}>
        <TaskForm
          mode="create"
          onCancel={closeCreateSheet}
          onSuccess={() => {
            closeCreateSheet();
            refreshTasks();
          }}
        />
      </Sheet>
    </>
  );
}

function NavTab({ tab, active, badge = false }) {
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className="relative flex min-h-(--size-tap-nav) min-w-(--size-tap-nav) flex-col items-center justify-center gap-0.5"
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute top-0.5 h-8 w-8 rounded-(--radius-pill)"
          style={{ backgroundColor: 'var(--color-indigo)' }}
          transition={SHEET_SPRING}
        />
      )}
      <span className="relative">
        <Icon
          size={22}
          strokeWidth={1.75}
          color={active ? 'var(--color-ink)' : 'var(--color-ink-3)'}
          aria-hidden="true"
        />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-(--radius-pill)"
            style={{ backgroundColor: 'var(--color-review)' }}
          />
        )}
      </span>
      <span
        className="relative text-[10px] font-medium"
        style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-3)' }}
      >
        {tab.label}
      </span>
    </Link>
  );
}
