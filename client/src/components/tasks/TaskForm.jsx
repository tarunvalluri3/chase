import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { ApiError, tasksApi } from '../../lib/apiClient';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/datetime';
import { PRIORITY_CONFIG } from './priorityConfig';
import { REPEAT_CONFIG } from './repeatConfig';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const REPEAT_RULES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];

function defaultDeadlineValue() {
  const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  inOneDay.setSeconds(0, 0);
  return toDatetimeLocalValue(inOneDay.toISOString());
}

// Shared create/edit form (DESIGN.md §7) — fields grouped inside one
// --color-surface panel, borderless sunken inputs, and a segmented-pill
// priority selector on a sunken track. Native `datetime-local` for the
// deadline (no date-picker library needed). Client-side validation is a
// UX nicety only — the server (PATCH/POST /api/tasks) remains the source
// of truth and its rejection is what actually surfaces field errors on
// submit.
export function TaskForm({ mode = 'create', task, onSuccess, onCancel }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [deadline, setDeadline] = useState(task ? toDatetimeLocalValue(task.deadline) : defaultDeadlineValue());
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminder_enabled ?? false);
  const [repeatRule, setRepeatRule] = useState(task?.repeat_rule ?? 'NONE');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!title.trim()) next.title = 'Title is required.';
    if (!deadline) next.deadline = 'Deadline is required.';
    if (!PRIORITIES.includes(priority)) next.priority = 'Choose a priority.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const body = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      deadline: fromDatetimeLocalValue(deadline),
      priority,
      reminder_enabled: reminderEnabled,
      repeat_rule: repeatRule,
    };

    setSubmitting(true);
    try {
      const saved = mode === 'edit' ? await tasksApi.patch(task.id, body) : await tasksApi.create(body);
      onSuccess?.(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details?.length) {
          const fieldErrors = {};
          for (const detail of error.details) fieldErrors[detail.path] = detail.message;
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-(--radius-lg) border border-(--border-hairline) bg-surface p-4 shadow-[var(--shadow-panel)]">
        <Field label="Title" htmlFor="task-title" error={errors.title}>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClassName}
            style={fieldBorderStyle(errors.title)}
            placeholder="e.g. Ship the Q3 pricing memo"
            autoComplete="off"
          />
        </Field>

        <Field label="Description" htmlFor="task-description" optional>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={`${inputClassName} min-h-0 py-2`}
            style={fieldBorderStyle(false)}
            placeholder="Optional detail"
          />
        </Field>

        <Field label="Deadline" htmlFor="task-deadline" error={errors.deadline}>
          <input
            id="task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={inputClassName}
            style={fieldBorderStyle(errors.deadline)}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-meta text-ink-2">Priority</legend>
          <div
            role="radiogroup"
            aria-label="Priority"
            className="flex gap-1 rounded-(--radius-md) bg-surface-sunken p-1"
          >
            {PRIORITIES.map((value) => {
              const selected = priority === value;
              const config = PRIORITY_CONFIG[value];
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPriority(value)}
                  className="min-h-(--size-tap-min) flex-1 rounded-(--radius-sm) text-body font-medium transition-colors"
                  style={{
                    color: selected ? config.label : 'var(--color-ink-2)',
                    backgroundColor: selected ? 'var(--color-surface)' : 'transparent',
                    boxShadow: selected ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {config.text}
                </button>
              );
            })}
          </div>
          {errors.priority && (
            <p role="alert" className="mt-1 text-meta" style={{ color: 'var(--color-danger)' }}>
              {errors.priority}
            </p>
          )}
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <span id="reminder-label" className="text-body text-ink">
            Reminder
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            aria-labelledby="reminder-label"
            onClick={() => setReminderEnabled((prev) => !prev)}
            className="relative h-7 w-12 shrink-0 rounded-(--radius-pill) transition-colors"
            style={{ backgroundColor: reminderEnabled ? 'var(--color-brand)' : 'var(--border-strong)' }}
          >
            <span
              aria-hidden="true"
              className="absolute top-0.5 h-6 w-6 rounded-(--radius-pill) bg-white transition-[left]"
              style={{ left: reminderEnabled ? '1.375rem' : '0.125rem' }}
            />
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 text-meta text-ink-2">Repeat</legend>
          <div
            role="radiogroup"
            aria-label="Repeat"
            className="flex flex-wrap gap-1 rounded-(--radius-md) bg-surface-sunken p-1"
          >
            {REPEAT_RULES.map((value) => {
              const selected = repeatRule === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRepeatRule(value)}
                  className="min-h-(--size-tap-min) flex-1 rounded-(--radius-sm) px-2 text-meta font-medium whitespace-nowrap transition-colors"
                  style={{
                    color: selected ? 'var(--color-ink)' : 'var(--color-ink-2)',
                    backgroundColor: selected ? 'var(--color-surface)' : 'transparent',
                    boxShadow: selected ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {REPEAT_CONFIG[value].text}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div
        className="flex items-start gap-2 rounded-(--radius-md) px-3 py-2.5 text-meta text-ink-2"
        style={{ backgroundColor: 'var(--color-brand-soft)' }}
      >
        <Info size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" color="var(--color-brand)" aria-hidden="true" />
        <span>Be specific and clear to stay focused and get things done!</span>
      </div>

      {formError && (
        <p role="alert" className="text-meta" style={{ color: 'var(--color-danger)' }}>
          {formError}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}

const inputClassName =
  'min-h-(--size-tap-min) w-full rounded-(--radius-md) border bg-surface-sunken px-3 text-base text-ink placeholder:text-ink-3 focus-visible:border-pine focus-visible:bg-surface focus-visible:outline-none transition-colors';

// 16px minimum on every input (DESIGN.md §3.2) is handled via `text-base`
// above. Inputs are borderless by default (DESIGN.md §7 TaskForm) — focus
// or an error state adds a Pine/Clay border on a surface background.
function fieldBorderStyle(hasError) {
  return {
    borderColor: hasError ? 'var(--color-danger)' : 'transparent',
    backgroundColor: hasError ? 'var(--color-surface)' : undefined,
  };
}

function Field({ label, htmlFor, error, optional, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-meta text-ink-2">
        {label}
        {optional && <span className="text-ink-3"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-meta" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
