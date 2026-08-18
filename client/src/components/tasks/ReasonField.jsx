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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-meta text-ink-2">
        {label}
      </label>
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        autoFocus={autoFocus}
        className="min-h-(--size-tap-min) w-full rounded-(--radius-md) border bg-surface-sunken px-3 py-2 text-base text-ink placeholder:text-ink-3 focus-visible:border-pine focus-visible:bg-surface focus-visible:outline-none transition-colors"
        style={{ borderColor: 'transparent' }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-meta text-ink-3">
          This is kept as history — it's what makes the patterns readable later.
        </p>
        {showCount && (
          <span className="shrink-0 font-mono text-meta text-ink-3">{value.length}</span>
        )}
      </div>
    </div>
  );
}
