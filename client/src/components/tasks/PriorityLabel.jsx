import { PRIORITY_CONFIG } from './priorityConfig';

export function PriorityLabel({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span>
      <span aria-hidden="true" />
      {config.text} priority
    </span>
  );
}
