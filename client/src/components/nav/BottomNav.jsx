import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { DURATION } from '../../lib/motion';
import { useTasksContext } from '../../lib/tasksStore';
import { NAV_TABS } from './navTabs';

// DESIGN.md v3 §6 — a dark navy bar holding exactly four always-visible
// icon+label slots; the active item gets ocean-blue icon/label color plus a
// subtle static blue background chip (no growing/morphing capsule). The
// Create FAB is a fully separate 56x56 circular element, flat brand-blue
// fill, a sibling of the bar in the same flex row.
//
// needsReviewCount comes from AppLayout's real useTaskCounts() — the
// ochre dot on the Tasks slot.
//
// The create Sheet itself lives in CreateTaskSheet, rendered once at the
// AppLayout level rather than nested here — this whole component is
// wrapped in `min-[960px]:hidden` by AppLayout, so a Sheet nested inside it
// would be unreachable at the desktop breakpoint even while "open".
export function BottomNav({ needsReviewCount = 0 }) {
  const { pathname } = useLocation();
  const { createSheetOpen, openCreateSheet } = useTasksContext();

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 pb-safe">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 pb-3">
        <div
          className="flex h-16 flex-1 items-center gap-1 rounded-(--radius-xl) border border-(--border-hairline) bg-surface-sunken px-1.5"
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
          type="button"
          onClick={openCreateSheet}
          aria-haspopup="dialog"
          aria-expanded={createSheetOpen}
          aria-label="Create task"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius-pill) text-white transition-transform active:scale-[0.93]"
          style={{
            background: 'var(--color-brand)',
            boxShadow: 'var(--shadow-fab)',
          }}
        >
          <Plus size={24} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function NavTab({ tab, active, badge = false }) {
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      aria-label={tab.label}
      className="relative flex min-h-(--size-tap-nav) flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-(--radius-md)"
    >
      {active && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0.5 rounded-(--radius-md)"
          style={{ backgroundColor: 'var(--color-brand-soft)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.fast }}
        />
      )}
      <span className="relative shrink-0">
        <Icon size={24} strokeWidth={1.8} color={active ? 'var(--color-brand)' : 'var(--color-ink-3)'} aria-hidden="true" />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-(--radius-pill)"
            style={{ backgroundColor: 'var(--color-review)' }}
          />
        )}
      </span>
      <span
        aria-hidden="true"
        className="relative text-meta font-semibold whitespace-nowrap"
        style={{ color: active ? 'var(--color-brand)' : 'var(--color-ink-3)' }}
      >
        {tab.label}
      </span>
    </Link>
  );
}
