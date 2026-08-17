import { PRIORITY_CONFIG } from './priorityConfig';

// The text half of monochrome priority (DESIGN.md §2.5/§8) — always present
// alongside PriorityRail so priority is legible in greyscale.
export function PriorityLabel({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`text-micro uppercase ${className}`} style={{ color: config.label }}>
      {config.text} priority
    </span>
  );
}
