import { useEffect, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { ReasonField, isReasonValid } from './ReasonField';

// DESIGN.md §7/§7.3 — reason required, destructive red confirm. The delete
// confirm button is the only red button in the app (§2.4); a resting
// DELETED task never carries red anywhere.
export function DeleteSheet({ open, onClose, onConfirm, returnFocusRef, submitting }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="Delete task" returnFocusRef={returnFocusRef}>
      <div className="flex flex-col gap-5">
        <p className="text-body text-ink-2">
          This removes the task from your active list for good. The record stays, but this can't be undone here.
        </p>
        <ReasonField label="Why are you deleting this?" value={reason} onChange={setReason} autoFocus />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={!isReasonValid(reason) || submitting}
            loading={submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            Delete task
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
