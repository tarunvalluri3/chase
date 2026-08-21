// Priority is now colored (DESIGN.md §2.2/§7 — reverses v1's monochrome
// rule): Pine = low, Dusk blue = medium, Clay red = high. Shared between
// PriorityLabel's dot, PriorityBreakdown's bars, and TaskForm's segmented
// control so none of them drift out of sync. Values reference tokens.css
// custom properties only, never a literal hex. `rail` is kept for
// PriorityBreakdown's chart bars even though TaskCard no longer renders a
// standalone priority rail (removed as a redundant third repetition of the
// same color PriorityLabel's dot+text already carries).
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
