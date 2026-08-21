// DESIGN.md §7.1/§7.2 — one of these per list/detail view, verbatim copy.
export function EmptyState({ title, description, action }) {
  return (
    <div>
      <p>{title}</p>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
