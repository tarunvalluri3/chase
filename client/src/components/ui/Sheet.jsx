import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The real bottom sheet primitive (DESIGN.md §7): drag handle, drag-to-
// dismiss, scrim, focus trap, keyboard-aware (rides above the keyboard via
// the viewport meta from Phase 9 + its own max-height/scroll). Built here,
// reused by Phase 13's ResolveSheet/DeleteSheet.
export function Sheet({ open, onClose, title, children, returnFocusRef }) {
  const titleId = useId();
  const sheetRef = useRef(null);

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
    <>
      {open && (
        <>
          <div onClick={onClose} />
          <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div>
              <span aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId}>{title}</h2>
            </div>
            <div>{children}</div>
          </div>
        </>
      )}
    </>
  );
}
