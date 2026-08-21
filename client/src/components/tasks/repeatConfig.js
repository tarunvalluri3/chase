// Repeat has no severity/color semantic (unlike priority), so this is just
// a label lookup — mirrors priorityConfig.js's shape for consistency.
export const REPEAT_CONFIG = {
  NONE: { text: 'Does not repeat' },
  DAILY: { text: 'Daily' },
  WEEKLY: { text: 'Weekly' },
  MONTHLY: { text: 'Monthly' },
};

export function repeatText(rule) {
  return REPEAT_CONFIG[rule]?.text ?? rule;
}
