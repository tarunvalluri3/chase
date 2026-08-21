import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
    <nav aria-label="Primary">
      <div>
        <div>
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
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function NavTab({ tab, active, badge = false }) {
  const Icon = tab.icon;
  return (
    <Link to={tab.to} aria-current={active ? 'page' : undefined} aria-label={tab.label}>
      {active && <span aria-hidden="true" />}
      <span>
        <Icon aria-hidden="true" />
        {badge && <span aria-hidden="true" />}
      </span>
      <span aria-hidden="true">{tab.label}</span>
    </Link>
  );
}
