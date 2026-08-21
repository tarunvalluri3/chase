// DESIGN.md §12 — one section per chart: a title, an optional one-line
// description, then the chart or its own empty/loading state.
export function ChartCard({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 px-gutter">
      <div className="flex flex-col gap-1">
        <h2 className="text-section text-ink">{title}</h2>
        {description && <p className="text-meta text-ink-3">{description}</p>}
      </div>
      {children}
    </div>
  );
}
