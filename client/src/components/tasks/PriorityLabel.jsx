import { PRIORITY_CONFIG } from './priorityConfig';

// The colored half of priority (DESIGN.md §2.2/§7): a dot + label on a 14%
// tint pill, always present so priority is legible in greyscale too (the
// word carries the meaning, color reinforces it).
export function PriorityLabel({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-(--radius-pill) px-2 py-0.5 text-micro uppercase ${className}`}
      style={{ color: config.label, backgroundColor: config.tint }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.label }} />
      {config.text} priority
    </span>
  );
}
