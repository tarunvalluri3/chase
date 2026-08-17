import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { DURATION, EASE_EXIT, EASE_OUT, SHEET_SPRING } from '../../lib/motion';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The real bottom sheet primitive (DESIGN.md §7): drag handle, drag-to-
// dismiss, scrim, focus trap, keyboard-aware (rides above the keyboard via
// the viewport meta from Phase 9 + its own max-height/scroll). Built here,
// reused by Phase 13's ResolveSheet/DeleteSheet.
//
// Drag is bound to the handle only (`dragListener={false}` + manual
// `dragControls.start()` on pointerdown) so it never fights scrolling or
// typing inside the sheet's own content.
export function Sheet({ open, onClose, title, children, returnFocusRef }) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const sheetRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return undefined;
    const node = sheetRef.current;
    const focusTarget = node?.querySelector(FOCUSABLE_SELECTOR);
    focusTarget?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const focusable = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      returnFocusRef?.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-30 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: DURATION.base, ease: EASE_EXIT } }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-(--radius-xl) bg-raised pb-safe"
            style={{ boxShadow: '0 -12px 40px rgba(0,0,0,.55)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: reducedMotion ? { duration: 0.12 } : SHEET_SPRING }}
            exit={{
              y: '100%',
              transition: reducedMotion ? { duration: 0.12 } : { duration: DURATION.base, ease: EASE_EXIT },
            }}
            drag={reducedMotion ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 80 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing"
            >
              <span className="h-1 w-9 rounded-(--radius-pill) bg-overlay" aria-hidden="true" />
            </div>
            <div className="px-gutter pt-2 pb-2">
              <h2 id={titleId} className="text-section text-ink">
                {title}
              </h2>
            </div>
            <div className="px-gutter pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
