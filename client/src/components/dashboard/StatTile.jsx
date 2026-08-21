// DESIGN.md v3 §7 "StatTile" — a stat card with a colored icon bubble per
// cell (replaces v2's ledger-strip/divider-rule treatment). `LedgerStrip` is
// the shared card container (surface panel, no divider rules — spacing
// alone separates cells, `flex-wrap` so a row that can't fit on one line
// reflows onto a second rather than scrolling); `StatTile` is one cell: an
// optional tinted icon bubble, a numeral, and a muted label below it.
// Reused by both Home's 5-cell status row (with icons) and Profile's 2-cell
// stat row (without).
export function LedgerStrip({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export function StatTile({ label, count, color, bg, icon: Icon }) {
  return (
    <div>
      {Icon && (
        <span aria-hidden="true">
          <Icon />
        </span>
      )}
      <span>{count}</span>
      <span>{label}</span>
    </div>
  );
}
