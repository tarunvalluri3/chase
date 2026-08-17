// Priority is monochrome (DESIGN.md §2.5) — shared between PriorityRail and
// PriorityLabel so the two never drift out of sync. Values reference
// tokens.css custom properties only, never a literal hex.
export const PRIORITY_CONFIG = {
  HIGH: { rail: 'var(--color-priority-high)', label: 'var(--color-priority-high)', text: 'High' },
  MEDIUM: { rail: 'var(--color-priority-medium)', label: 'var(--color-priority-medium)', text: 'Medium' },
  LOW: { rail: 'var(--color-priority-low-rail)', label: 'var(--color-priority-low-label)', text: 'Low' },
};

export function priorityText(priority) {
  return PRIORITY_CONFIG[priority]?.text ?? priority;
}
