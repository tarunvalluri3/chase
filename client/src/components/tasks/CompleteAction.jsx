import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';

// DESIGN.md §7.3 — Complete is low-risk and (in spirit) reversible even
// though the backend can't un-complete a task, so a lightweight confirm is
// enough: a small sheet rather than a full reason-collection flow.
export function CompleteConfirmSheet({ open, onClose, onConfirm, returnFocusRef, submitting }) {
  return (
    <Sheet open={open} onClose={onClose} title="Complete this task?" returnFocusRef={returnFocusRef}>
      <div className="flex flex-col gap-5">
        <p className="text-body text-ink-2">This marks the task complete. There's no way to undo it from here.</p>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" loading={submitting} onClick={onConfirm}>
            Complete
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
