// DESIGN.md §7/§3.1 — mono display numerals (`tabular-nums` global rule on
// mono, so counts never jitter when they update), 2-up grid via the parent.
export function StatTile({ label, count, color, className = '' }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4 ${className}`}
    >
      <span className="font-mono text-display text-ink">{count}</span>
      <span className="text-micro" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
