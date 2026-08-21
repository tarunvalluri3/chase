// DESIGN.md §12 — one section per chart: a title, an optional one-line
// description, then the chart or its own empty/loading state.
export function ChartCard({ title, description, children }) {
  return (
    <div>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
