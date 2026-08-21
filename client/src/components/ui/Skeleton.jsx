// Shimmer block — DESIGN.md §5.5/§7.1. Never a centered spinner.
export function Skeleton() {
  return <div aria-hidden="true" />;
}

// Three skeleton cards at real TaskCard dimensions (DESIGN.md §7.1 loading
// state) — never a centered spinner.
export function TaskCardSkeleton() {
  return (
    <div>
      <Skeleton />
      <div>
        <Skeleton />
        <div>
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeletonList() {
  return (
    <div>
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
    <div>
      <Skeleton />
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div>
      <Skeleton />
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  );
}
