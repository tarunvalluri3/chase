// DESIGN.md §12 — chart loading/empty states. Loading reuses the app's one
// shimmer mechanism (§5.5), never a centered spinner; sizes are fixed
// (rather than piped through style props) to match Tailwind's static-class
// scanning, same convention as Skeleton.jsx's other fixed-height variants.
const SIZE_CLASS = { sm: 'h-[120px]', md: 'h-[180px]', lg: 'h-[220px]' };

export function ChartSkeleton({ size = 'md' }) {
  return <div aria-hidden="true" className={`shimmer mx-gutter rounded-(--radius-lg) ${SIZE_CLASS[size]}`} />;
}

export function ChartEmpty({ message }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-(--radius-lg) border border-(--border-hairline) bg-surface px-4 text-center text-meta text-ink-3">
      {message}
    </div>
  );
}
