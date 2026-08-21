// DESIGN.md v3 §7 "StatTile" — a stat card with a colored icon bubble per
// cell (replaces v2's ledger-strip/divider-rule treatment). `LedgerStrip` is
// the shared card container (surface panel, no divider rules — spacing
// alone separates cells); `StatTile` is one cell: an optional colored icon
// bubble, a numeral, and a muted label below it. Reused by both Home's
// 5-cell status row (with icons) and Profile's 2-cell stat row (without).
export function LedgerStrip({ children, className = '' }) {
  return (
    <div
      className={`flex items-start justify-between gap-2 rounded-(--radius-lg) border border-(--border-hairline) bg-surface px-3 py-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, count, color, icon: Icon, className = '' }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-2 px-1 text-center ${className}`}>
      {Icon && (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-(--radius-pill)"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-surface))` }}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
      )}
      <span className="font-tabular text-[1.75rem] leading-8 font-semibold text-ink">{count}</span>
      <span className="text-micro text-ink-3">{label}</span>
    </div>
  );
}
