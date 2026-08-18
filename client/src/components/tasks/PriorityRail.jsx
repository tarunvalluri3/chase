import { PRIORITY_CONFIG } from './priorityConfig';

// DESIGN.md §4.1/§7 — the 4px priority-colored left rail on every task
// card. Colored now (Pine/Dusk/Clay), always paired with PriorityLabel's
// text so priority is never carried by color alone.
export function PriorityRail({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      aria-hidden="true"
      className={`block w-1 shrink-0 self-stretch rounded-full ${className}`}
      style={{ backgroundColor: config.rail }}
    />
  );
}
