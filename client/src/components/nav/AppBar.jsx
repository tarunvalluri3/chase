import { ChevronLeft } from 'lucide-react';

// DESIGN.md §6.2 — screen title (`title` scale) + mono uppercase context line.
// At most one trailing action. No back chevron on tab roots: the tab bar is
// the back affordance. `onBack` is only ever passed for a non-root screen
// (task detail, Phase 12) — the tab roots never pass it.
export function AppBar({ title, context, action, onBack }) {
  return (
    <header className="flex items-start justify-between gap-3 px-gutter pt-safe pt-6 pb-4">
      <div className="flex min-w-0 items-start gap-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm) text-ink-2 hover:text-ink"
          >
            <ChevronLeft size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-title text-ink">{title}</h1>
          {context && <p className="mt-1 text-micro text-ink-3">{context}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}
