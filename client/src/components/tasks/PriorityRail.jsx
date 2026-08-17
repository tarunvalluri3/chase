import { PRIORITY_CONFIG } from './priorityConfig';

// DESIGN.md §2.5 — a 3px left rail on the card, brighter = more urgent.
// No hue of its own; always paired with PriorityLabel's text so priority
// is never carried by color alone.
export function PriorityRail({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      aria-hidden="true"
      className={`block w-[3px] shrink-0 self-stretch rounded-full ${className}`}
      style={{ backgroundColor: config.rail }}
    />
  );
}
