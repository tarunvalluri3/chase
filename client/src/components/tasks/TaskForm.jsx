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
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <Field label="Title" htmlFor="task-title" error={errors.title}>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
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
            placeholder="Optional detail"
          />
        </Field>

        <Field label="Deadline" htmlFor="task-deadline" error={errors.deadline}>
          <input
            id="task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend>Priority</legend>
          <div role="radiogroup" aria-label="Priority">
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
                >
                  {config.text}
                </button>
              );
            })}
          </div>
          {errors.priority && <p role="alert">{errors.priority}</p>}
        </fieldset>

        <div>
          <span id="reminder-label">Reminder</span>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            aria-labelledby="reminder-label"
            onClick={() => setReminderEnabled((prev) => !prev)}
          >
            <span aria-hidden="true" />
          </button>
        </div>

        <fieldset>
          <legend>Repeat</legend>
          <div role="radiogroup" aria-label="Repeat">
            {REPEAT_RULES.map((value) => {
              const selected = repeatRule === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRepeatRule(value)}
                >
                  {REPEAT_CONFIG[value].text}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div>
        <Info aria-hidden="true" />
        <span>Be specific and clear to stay focused and get things done!</span>
      </div>

      {formError && <p role="alert">{formError}</p>}

      <div>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, error, optional, children }) {
  return (
    <div>
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span> (optional)</span>}
      </label>
      {children}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
