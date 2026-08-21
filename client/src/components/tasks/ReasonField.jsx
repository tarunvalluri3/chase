import { useId } from 'react';

const COUNT_THRESHOLD = 120;

export function isReasonValid(value) {
  return value.trim().length > 0;
}

// DESIGN.md §3.3/§7 — trims before validating, submit disabled while
// empty (enforced by callers via isReasonValid), live character count only
// past 120 chars so a short reason doesn't feel like it's being graded.
export function ReasonField({ label, value, onChange, autoFocus = false, id }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const showCount = value.length > COUNT_THRESHOLD;

  return (
    <div>
      <label htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        autoFocus={autoFocus}
      />
      <div>
        <p>
          This is kept as history — it's what makes the patterns readable later.
        </p>
        {showCount && (
          <span>{value.length}</span>
        )}
      </div>
    </div>
  );
}
