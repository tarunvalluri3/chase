import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useToast } from '../../lib/toastStore';
import { DURATION, EASE_ENTER, EASE_EXIT } from '../../lib/motion';

// DESIGN.md §7 — bottom, above the nav, aria-live="polite", one at a time.
// Sits above BottomNav's 56px + safe-area bar with a small gap.
export function ToastViewport() {
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-gutter"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 12px)' }}
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: reducedMotion ? 0.12 : DURATION.base, ease: EASE_ENTER },
            }}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.12 } }
                : { opacity: 0, y: 12, transition: { duration: DURATION.base, ease: EASE_EXIT } }
            }
            className="pointer-events-auto max-w-[min(24rem,calc(100vw-2rem))] rounded-(--radius-md) bg-surface px-4 py-3 text-body text-ink"
            style={{ boxShadow: 'var(--shadow-toast)' }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
