import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SHEET_SPRING } from '../../lib/motion';
import { Sheet } from '../ui/Sheet';
import { TaskForm } from '../tasks/TaskForm';
import { useTasksContext } from '../../lib/tasksStore';
import { NAV_TABS } from './navTabs';

// DESIGN.md §6.1 — a pill track holding exactly four icon slots (no
// spacer, no FAB inside the track); the active item grows into a labeled
// white capsule, inactive items show icon only. The Create FAB is a fully
// separate circular element, a sibling of the pill in the same flex row.
//
// needsReviewCount comes from AppLayout's real useTaskCounts() — the
// ochre dot on the Tasks slot.
export function BottomNav({ needsReviewCount = 0 }) {
  const { pathname } = useLocation();
  const createButtonRef = useRef(null);
  const { createSheetOpen, openCreateSheet, closeCreateSheet, refreshTasks } = useTasksContext();

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 pb-safe">
        <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 pb-3">
          <div
            className="flex h-14 flex-1 items-center gap-1 rounded-(--radius-pill) bg-surface-sunken p-[5px]"
            style={{ boxShadow: 'var(--shadow-nav-pill)' }}
          >
            {NAV_TABS.map((tab) => (
              <NavTab
                key={tab.key}
                tab={tab}
                active={tab.isActive(pathname)}
                badge={tab.key === 'tasks' && needsReviewCount > 0}
              />
            ))}
          </div>

          <button
            ref={createButtonRef}
            type="button"
            onClick={openCreateSheet}
            aria-haspopup="dialog"
            aria-expanded={createSheetOpen}
            aria-label="Create task"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-(--radius-pill) text-canvas transition-transform active:scale-[0.93]"
            style={{
              background: 'var(--gradient-fab)',
              boxShadow: 'var(--shadow-fab)',
            }}
          >
            <Plus size={22} strokeWidth={2} aria-hidden="true" />
          </button>
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
      aria-label={tab.label}
      className="relative flex min-h-(--size-tap-nav) items-center justify-center gap-1.5 overflow-hidden rounded-(--radius-pill)"
      style={{ flex: active ? 2 : 1 }}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0.5 rounded-(--radius-pill) bg-surface"
          style={{ boxShadow: 'var(--shadow-card)' }}
          transition={SHEET_SPRING}
        />
      )}
      <span className="relative shrink-0">
        <Icon size={19} strokeWidth={1.8} color={active ? 'var(--color-pine)' : 'var(--color-ink-3)'} aria-hidden="true" />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-(--radius-pill)"
            style={{ backgroundColor: 'var(--color-review)' }}
          />
        )}
      </span>
      {active && (
        <span aria-hidden="true" className="relative text-meta font-semibold whitespace-nowrap" style={{ color: 'var(--color-pine)' }}>
          {tab.label}
        </span>
      )}
    </Link>
  );
}
