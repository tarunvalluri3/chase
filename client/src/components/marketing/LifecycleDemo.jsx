import { useEffect, useState } from 'react';

// The landing page's one proof: a task moving through the real lifecycle
// (ACTIVE -> MISSED "Needs review" -> resolved COMPLETED), reusing the
// app's own signature completion moment (DESIGN.md §5.4) rather than
// inventing marketing-only motion. This is the mechanism, not an icon of it.

const STATUS_META = {
  active: { label: 'Active', color: 'var(--color-active)' },
  missed: { label: 'Needs review', color: 'var(--color-review)' },
  completed: { label: 'Completed', color: 'var(--color-completed)' },
};

const CYCLE = ['active', 'missed', 'completing', 'completed'];
const HOLD_MS = { active: 2800, missed: 2600, completing: 620, completed: 1800 };

const META_LINE = {
  active: 'Due in 2h',
  missed: 'Deadline passed — unconfirmed',
  completing: 'Deadline passed — unconfirmed',
  completed: 'Marked complete',
};

export function LifecycleDemo() {
  const [phase, setPhase] = useState(CYCLE[0]);

  useEffect(() => {
    const idx = CYCLE.indexOf(phase);
    const safeIdx = idx === -1 ? 0 : idx;
    const next = CYCLE[(safeIdx + 1) % CYCLE.length];
    const hold = HOLD_MS[phase];
    const timer = setTimeout(() => setPhase(next), hold);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const displayStatus = phase === 'active' ? 'active' : phase === 'missed' ? 'missed' : 'completed';
  const meta = STATUS_META[displayStatus];
  const flourish = phase === 'completing';

  return (
    <div
      role="img"
      aria-label={`Demonstration task card cycling through Active, Needs review, and Completed states. Currently: ${meta.label}.`}
    >
      <div aria-hidden="true" />

      <div>
        {flourish && <div aria-hidden="true" />}

        <div>
          <p>Ship the Q3 pricing memo</p>

          {flourish ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10.5L8 14.5L16 6" />
            </svg>
          ) : (
            <span>{meta.label}</span>
          )}
        </div>

        <div>
          <span>{META_LINE[phase]}</span>
          <span>HIGH PRIORITY</span>
        </div>
      </div>
    </div>
  );
}
