// Shimmer block — DESIGN.md §5.5/§7.1. Never a centered spinner.
// Minimal shape now; Phase 12 grows this into card/list-row variants.
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`shimmer rounded-(--radius-md) ${className}`} />;
}
