// DESIGN.md §2.4 — five variants, 14% alpha tint background over surface.
// MISSED reads "Needs review" and INCOMPLETE reads "Not done": the API
// status name is unchanged, the chip states the action required instead of
// passing a verdict.
const STATUS_CONFIG = {
  ACTIVE: { color: 'var(--color-active)', label: 'Active' },
  COMPLETED: { color: 'var(--color-completed)', label: 'Completed' },
  MISSED: { color: 'var(--color-review)', label: 'Needs review' },
  INCOMPLETE: { color: 'var(--color-notdone)', label: 'Not done' },
  DELETED: { color: 'var(--color-deleted)', label: 'Deleted' },
};

export function statusLabel(status) {
  return STATUS_CONFIG[status]?.label ?? status;
}

export function StatusChip({ status, className = '' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center text-micro font-semibold whitespace-nowrap ${className}`}
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  );
}
