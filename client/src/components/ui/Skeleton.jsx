// Shimmer block — DESIGN.md §5.5/§7.1. Never a centered spinner.
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`shimmer rounded-(--radius-md) ${className}`} />;
}

// Three skeleton cards at real TaskCard dimensions (DESIGN.md §7.1 loading
// state) — never a centered spinner.
export function TaskCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4">
      <Skeleton className="w-[3px] shrink-0 self-stretch rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeletonList() {
  return (
    <div className="flex flex-col gap-(--spacing-stack-gap) px-gutter pt-4">
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  );
}

// Dashboard's loading state (DESIGN.md §7.1/§4.1 — a skeleton for the
// ledger strip is an explicit acceptance criterion). Same single-row
// shape as the real StatusCounts ledger strip.
export function DashboardStatSkeleton() {
  return (
    <div className="px-gutter pt-4">
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-gutter pt-2">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
