import { useEffect, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { ReasonField, isReasonValid } from './ReasonField';

// DESIGN.md §3.3/§7/§7.3 — the two outcomes at equal visual weight, neither
// pre-selected. Copy is verbatim: the missed prompt, both option labels,
// and the "What got in the way?" reason label. Choosing "I completed this"
// needs no reason; choosing "I didn't complete this" reveals the reason
// step (mirrors DeleteSheet's reason UX per the phase prompt).
export function ResolveSheet({ open, onClose, onResolve, returnFocusRef, submitting }) {
  const [choice, setChoice] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setChoice(null);
      setReason('');
    }
  }, [open]);

  const canConfirm = choice === 'COMPLETED' || (choice === 'INCOMPLETE' && isReasonValid(reason));

  function handleConfirm() {
    if (choice === 'COMPLETED') {
      onResolve({ resolution: 'COMPLETED' });
    } else if (choice === 'INCOMPLETE') {
      onResolve({ resolution: 'INCOMPLETE', reason: reason.trim() });
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="What actually happened?" returnFocusRef={returnFocusRef}>
      <div>
        <p>
          The deadline passed before this was confirmed. What actually happened?
        </p>

        <div role="radiogroup" aria-label="What actually happened?">
          <ChoiceButton
            label="I completed this"
            selected={choice === 'COMPLETED'}
            onClick={() => setChoice('COMPLETED')}
          />
          <ChoiceButton
            label="I didn't complete this"
            selected={choice === 'INCOMPLETE'}
            onClick={() => setChoice('INCOMPLETE')}
          />
        </div>

        {choice === 'INCOMPLETE' && (
          <ReasonField label="What got in the way?" value={reason} onChange={setReason} autoFocus />
        )}

        <div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canConfirm || submitting}
            loading={submitting}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function ChoiceButton({ label, selected, onClick }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}>
      {label}
    </button>
  );
}
