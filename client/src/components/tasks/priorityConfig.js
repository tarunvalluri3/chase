// Priority is now colored (DESIGN.md §2.2/§7 — reverses v1's monochrome
// rule): Pine = low, Dusk blue = medium, Clay red = high. Shared between
// PriorityRail, PriorityLabel, and TaskForm's segmented control so the
// three never drift out of sync. Values reference tokens.css custom
// properties only, never a literal hex.
export const PRIORITY_CONFIG = {
  HIGH: {
    rail: 'var(--color-priority-high)',
    label: 'var(--color-priority-high)',
    tint: 'var(--color-priority-high-tint)',
    text: 'High',
  },
  MEDIUM: {
    rail: 'var(--color-priority-medium)',
    label: 'var(--color-priority-medium)',
    tint: 'var(--color-priority-medium-tint)',
    text: 'Medium',
  },
  LOW: {
    rail: 'var(--color-priority-low)',
    label: 'var(--color-priority-low)',
    tint: 'var(--color-priority-low-tint)',
    text: 'Low',
  },
};

export function priorityText(priority) {
  return PRIORITY_CONFIG[priority]?.text ?? priority;
}
