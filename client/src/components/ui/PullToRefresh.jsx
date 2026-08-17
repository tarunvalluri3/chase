import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 64;
const MAX_PULL = 80;

// DESIGN.md §9 — pull-to-refresh on every task list. Only engages when the
// scroll container is already at its top, so it never fights normal
// scrolling further down the list.
//
// DESIGN.md §5: "transform and opacity only, never height/top/left/width."
// The content is pushed down via `translateY` (revealing the spinner
// behind it) rather than growing an indicator element's height.
export function PullToRefresh({ onRefresh, refreshing, children }) {
  const containerRef = useRef(null);
  const startY = useRef(null);
  const [pull, setPull] = useState(0);

  function handleTouchStart(event) {
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startY.current = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (startY.current == null) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, MAX_PULL));
    }
  }

  function handleTouchEnd() {
    if (pull >= THRESHOLD && !refreshing) onRefresh();
    setPull(0);
    startY.current = null;
  }

  const offset = refreshing ? 40 : pull;
  const settling = pull === 0 && !refreshing;

  return (
    <div
      ref={containerRef}
      className="relative overscroll-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-3"
        style={{
          opacity: refreshing ? 1 : Math.min(pull / THRESHOLD, 1),
          transform: `translateY(${offset - 28}px)`,
          transition: settling ? 'transform 150ms var(--ease-out), opacity 150ms var(--ease-out)' : 'none',
        }}
      >
        <RefreshCw
          size={18}
          strokeWidth={1.75}
          color="var(--color-ink-3)"
          className={refreshing ? 'animate-spin' : ''}
          style={{ transform: refreshing ? undefined : `rotate(${Math.min(pull * 3, 180)}deg)` }}
        />
      </div>
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: settling ? 'transform 150ms var(--ease-out)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
