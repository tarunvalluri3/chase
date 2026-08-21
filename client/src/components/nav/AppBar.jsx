import { ChevronLeft } from 'lucide-react';

// DESIGN.md §6.2 — screen title (`title` scale) + micro-scale accent context
// line (--text-micro's own 0.06em tracking gives the uppercase-mono feel,
// no separate font-weight/tracking classes needed).
// At most one trailing action. No back chevron on tab roots: the tab bar is
// the back affordance. `onBack` is only ever passed for a non-root screen
// (task detail, Phase 12) — the tab roots never pass it.
export function AppBar({ title, context, action, onBack }) {
  return (
    <header>
      <div>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back">
            <ChevronLeft aria-hidden="true" />
          </button>
        )}
        <div>
          <h1>{title}</h1>
          {context && <p>{context}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
