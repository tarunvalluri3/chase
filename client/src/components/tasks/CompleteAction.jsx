import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';

// DESIGN.md §7.3 — Complete is low-risk and (in spirit) reversible even
// though the backend can't un-complete a task, so a lightweight confirm is
// enough: a small sheet rather than a full reason-collection flow.
export function CompleteConfirmSheet({ open, onClose, onConfirm, returnFocusRef, submitting }) {
  return (
    <Sheet open={open} onClose={onClose} title="Complete this task?" returnFocusRef={returnFocusRef}>
      <div>
        <p>This marks the task complete. There's no way to undo it from here.</p>
        <div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" loading={submitting} onClick={onConfirm}>
            Complete
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
