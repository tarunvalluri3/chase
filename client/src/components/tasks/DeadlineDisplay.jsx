import { formatDeadline } from '../../lib/datetime';

export function DeadlineDisplay({ deadline, className = '', variant = 'default' }) {
  return (
    <time dateTime={deadline}>
      {formatDeadline(deadline)}
    </time>
  );
}
