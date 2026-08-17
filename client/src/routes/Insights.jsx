import { Lock } from 'lucide-react';

// Styled, locked placeholder per DESIGN.md §6 nav table — real analytics land
// in Phase 15. Route is real and deep-linkable now so the nav slot is whole.
export default function Insights() {
  return (
    <div className="flex flex-col items-center gap-3 px-gutter pt-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) bg-surface">
        <Lock size={20} strokeWidth={1.75} color="var(--color-ink-3)" aria-hidden="true" />
      </span>
      <p className="text-section text-ink">Insights are locked for now.</p>
      <p className="max-w-xs text-body text-ink-2">
        Patterns across your completed, missed, and dropped work will show up here once there's
        enough history to read.
      </p>
    </div>
  );
}
