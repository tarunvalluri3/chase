// DESIGN.md §4.1/§7 "StatTile → ledger strip" — replaces v1's bordered 2-up
// KPI-tile grid. `LedgerStrip` is the flex-row container (surface panel,
// thin vertical rule dividers between cells); `StatTile` is one cell:
// a Literata numeral over a mono micro label, no card chrome of its own.
export function LedgerStrip({ children, className = '' }) {
  return (
    <div
      className={`flex items-stretch rounded-(--radius-lg) border border-(--border-hairline) bg-surface px-2 py-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, count, color, className = '' }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 border-l border-(--color-rule) px-2 first:border-l-0 ${className}`}>
      <span className="font-serif text-display text-ink">{count}</span>
      <span className="text-micro" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
