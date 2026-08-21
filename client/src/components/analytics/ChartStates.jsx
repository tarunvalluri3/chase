// DESIGN.md §12 — chart loading/empty states. Loading reuses the app's one
// shimmer mechanism (§5.5), never a centered spinner; sizes are fixed
// (rather than piped through style props) to match Tailwind's static-class
// scanning, same convention as Skeleton.jsx's other fixed-height variants.

export function ChartSkeleton() {
  return <div aria-hidden="true" />;
}

export function ChartEmpty({ message }) {
  return (
    <div>
      {message}
    </div>
  );
}
