// UTC -> local formatting — DESIGN.md §9. No date library needed for this scope.

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const absoluteFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Relative under 48h ("in 2h", "2d overdue"), absolute beyond — DeadlineDisplay spec (§7).
export function formatDeadline(isoUtc, { now = new Date() } = {}) {
  const target = new Date(isoUtc);
  const diffMs = target.getTime() - now.getTime();

  if (Math.abs(diffMs) < 48 * HOUR) {
    if (Math.abs(diffMs) >= HOUR) {
      return relativeFormatter.format(Math.round(diffMs / HOUR), 'hour');
    }
    return relativeFormatter.format(Math.round(diffMs / MINUTE), 'minute');
  }

  return absoluteFormatter.format(target);
}

export function formatTimestamp(isoUtc) {
  return absoluteFormatter.format(new Date(isoUtc));
}
