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

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

// AppBar's mono uppercase context line for the Home screen (DESIGN.md §6.2).
export function formatTodayContext(now = new Date()) {
  return dayFormatter.format(now).toUpperCase();
}

// Converts an ISO UTC string to the local value a native
// <input type="datetime-local"> expects (no timezone, minute precision).
export function toDatetimeLocalValue(isoUtc) {
  const d = new Date(isoUtc);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Converts a <input type="datetime-local"> value (interpreted as local time
// by the browser) back to an ISO UTC string for the API.
export function fromDatetimeLocalValue(localValue) {
  return new Date(localValue).toISOString();
}
