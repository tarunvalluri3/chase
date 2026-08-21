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
    <aside aria-label="Primary">
      <Link to="/" aria-label="Chase home">
        <img src="/brand/chase-mark-on-dark.svg" alt="" />
        <span>Chase</span>
      </Link>

      <Button variant="primary" size="md" onClick={openCreateSheet}>
        <Plus aria-hidden="true" />
        New task
      </Button>

      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(pathname);
        return (
          <Link key={tab.key} to={tab.to} aria-current={active ? 'page' : undefined}>
            <span>
              <Icon aria-hidden="true" />
              {tab.key === 'tasks' && needsReviewCount > 0 && <span aria-hidden="true" />}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
