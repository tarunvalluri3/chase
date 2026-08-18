// DESIGN.md §7.1/§7.2 — one of these per list/detail view, verbatim copy.
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-gutter pt-16 text-center">
      <p className="font-serif text-section text-ink">{title}</p>
      {description && <p className="max-w-xs text-body text-ink-2">{description}</p>}
      {action}
    </div>
  );
}
