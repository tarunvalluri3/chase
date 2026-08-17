import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE_OUT } from '../../lib/motion';

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
const REDUCED_CYCLE = ['active', 'missed', 'completed'];
const HOLD_MS = { active: 2800, missed: 2600, completing: 620, completed: 1800 };
const REDUCED_HOLD_MS = 2200;

const META_LINE = {
  active: 'Due in 2h',
  missed: 'Deadline passed — unconfirmed',
  completing: 'Deadline passed — unconfirmed',
  completed: 'Marked complete',
};

export function LifecycleDemo() {
  const reducedMotion = useReducedMotion();
  const order = reducedMotion ? REDUCED_CYCLE : CYCLE;
  const [phase, setPhase] = useState(order[0]);

  useEffect(() => {
    const idx = order.indexOf(phase);
    const safeIdx = idx === -1 ? 0 : idx;
    const next = order[(safeIdx + 1) % order.length];
    const hold = reducedMotion ? REDUCED_HOLD_MS : HOLD_MS[phase];
    const timer = setTimeout(() => setPhase(next), hold);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  const displayStatus = phase === 'active' ? 'active' : phase === 'missed' ? 'missed' : 'completed';
  const meta = STATUS_META[displayStatus];
  const flourish = phase === 'completing';

  return (
    <div
      className="relative w-full max-w-sm overflow-hidden rounded-(--radius-lg) border border-(--border-hairline) bg-surface"
      role="img"
      aria-label={`Demonstration task card cycling through Active, Needs review, and Completed states. Currently: ${meta.label}.`}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: 'var(--color-priority-high)' }}
        aria-hidden="true"
      />

      <motion.div
        className="relative flex flex-col gap-3 py-5 pr-5 pl-5"
        animate={flourish && !reducedMotion ? { scale: [1, 0.97, 1] } : { scale: 1 }}
        transition={{ duration: DURATION.instant, ease: EASE_OUT }}
      >
        {flourish && !reducedMotion && (
          <motion.div
            className="absolute inset-0 origin-left"
            style={{ backgroundColor: 'var(--color-completed)' }}
            initial={{ scaleX: 0, opacity: 0.35 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.09, ease: EASE_OUT }}
            aria-hidden="true"
          />
        )}

        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-task text-ink">Ship the Q3 pricing memo</p>

          {flourish && !reducedMotion ? (
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <motion.path
                d="M4 10.5L8 14.5L16 6"
                stroke="var(--color-completed)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.24, delay: 0.2, ease: EASE_OUT }}
              />
            </motion.svg>
          ) : (
            <span
              className="shrink-0 rounded-(--radius-pill) px-2.5 py-1 text-micro"
              style={{
                color: meta.color,
                backgroundColor: `color-mix(in srgb, ${meta.color} 14%, var(--color-surface))`,
              }}
            >
              {meta.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-meta text-ink-3">{META_LINE[phase]}</span>
          <span className="text-micro text-ink-3">HIGH PRIORITY</span>
        </div>
      </motion.div>
    </div>
  );
}
