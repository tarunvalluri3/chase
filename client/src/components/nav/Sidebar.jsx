import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { NAV_TABS } from './navTabs';
import { Button } from '../ui/Button';
import { useTasksContext } from '../../lib/tasksStore';

// DESIGN.md §6.3 — desktop-only (>=960px) fixed 220px left sidebar: logo
// + four vertical nav items, active item gets a Pine-tint background pill.
// Same four destinations/routes as BottomNav, just a different chrome —
// no new IA. Hidden below 960px; the bottom nav is authoritative there.
//
// "New task" reuses the same openCreateSheet from TasksProvider that
// BottomNav's FAB and Home's empty-state button already call — this is the
// only create entry point at >=960px, since BottomNav (and its FAB) is
// hidden entirely at that width and Home's own button only shows once a
// user has zero tasks.
export function Sidebar({ needsReviewCount = 0 }) {
  const { pathname } = useLocation();
  const { openCreateSheet } = useTasksContext();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col gap-1 border-r border-(--border-hairline) bg-surface p-4 min-[960px]:flex"
      aria-label="Primary"
    >
      <Link to="/" className="mb-6 flex items-center gap-2 px-2 pt-2" aria-label="Chase home">
        <img src="/brand/chase-mark-on-dark.svg" alt="" className="h-6 w-6" />
        <span className="text-section text-ink">Chase</span>
      </Link>

      <Button variant="primary" size="md" className="mb-4 w-full" onClick={openCreateSheet}>
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
        New task
      </Button>

      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.key}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className="relative flex items-center gap-3 rounded-(--radius-md) px-3 py-2.5 text-body transition-colors"
            style={{
              backgroundColor: active ? 'var(--color-pine-tint)' : 'transparent',
              color: active ? 'var(--color-pine)' : 'var(--color-ink-2)',
            }}
          >
            <span className="relative">
              <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
              {tab.key === 'tasks' && needsReviewCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-(--radius-pill)"
                  style={{ backgroundColor: 'var(--color-review)' }}
                />
              )}
            </span>
            <span className="text-meta font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
