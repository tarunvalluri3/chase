import { useState } from 'react';
import { Button } from '../ui/Button';
import { ApiError, tasksApi } from '../../lib/apiClient';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/datetime';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const PRIORITY_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

function defaultDeadlineValue() {
  const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  inOneDay.setSeconds(0, 0);
  return toDatetimeLocalValue(inOneDay.toISOString());
}

// Shared create/edit form (DESIGN.md §7). Native `datetime-local` for the
// deadline (no date-picker library needed), priority as a three-way
// segmented control. Client-side validation is a UX nicety only — the
// server (PATCH/POST /api/tasks) remains the source of truth and its
// rejection is what actually surfaces field errors on submit.
export function TaskForm({ mode = 'create', task, onSuccess, onCancel }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [deadline, setDeadline] = useState(task ? toDatetimeLocalValue(task.deadline) : defaultDeadlineValue());
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
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
        <div role="radiogroup" aria-label="Priority" className="flex gap-2">
          {PRIORITIES.map((value) => {
            const selected = priority === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPriority(value)}
                className="min-h-(--size-tap-min) flex-1 rounded-(--radius-md) border text-base transition-colors"
                style={{
                  borderColor: selected ? 'var(--color-accent)' : 'var(--border-strong)',
                  color: selected ? 'var(--color-ink)' : 'var(--color-ink-2)',
                  backgroundColor: selected ? 'var(--color-overlay)' : 'transparent',
                }}
              >
                {PRIORITY_LABEL[value]}
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
  'min-h-(--size-tap-min) w-full rounded-(--radius-md) border bg-raised px-3 text-base text-ink placeholder:text-ink-3 focus-visible:outline-none';

// 16px minimum on every input (DESIGN.md §3.2) is handled via `text-base`
// above; only the border color needs to respond to validation state, and
// that's a token reference, never a literal hex.
function fieldBorderStyle(hasError) {
  return { borderColor: hasError ? 'var(--color-danger)' : 'var(--border-strong)' };
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
