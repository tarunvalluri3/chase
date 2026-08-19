const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatDeadline(deadline) {
  return `${dateFormatter.format(new Date(deadline))} UTC`;
}

function taskUrl(task) {
  const base = process.env.CLIENT_URL;
  return base ? `${base.replace(/\/$/, '')}/tasks/${task.status.toLowerCase()}/${task.id}` : null;
}

function builders(task, extra) {
  return {
    TASK_CREATED: () => ({
      title: `Task created: ${task.title}`,
      lines: [`Deadline: ${formatDeadline(task.deadline)}`, `Priority: ${task.priority}`],
    }),

    TASK_COMPLETED: () => ({
      title: `Completed: ${task.title}`,
      lines: ['Nice work -- this task is now marked complete.'],
    }),

    TASK_INCOMPLETE: () => ({
      title: `Not done: ${task.title}`,
      lines: [`You confirmed this task wasn't completed: "${task.incomplete_reason}"`],
    }),

    TASK_DELETED: () => ({
      title: `Deleted: ${task.title}`,
      lines: [`Reason: ${task.deletion_reason}`],
    }),

    TASK_UPDATED: () => ({
      title: `Updated: ${task.title}`,
      lines: [
        `Deadline: ${formatDeadline(task.deadline)}`,
        `Priority: ${task.priority}`,
        ...(extra.changedFields?.length ? [`Changed: ${extra.changedFields.join(', ')}`] : []),
      ],
    }),

    TASK_MISSED: () => ({
      title: `Needs review: ${task.title}`,
      lines: [
        'The deadline passed before this was confirmed complete.',
        'Open the task to confirm whether it was actually done.',
      ],
    }),

    DEADLINE_REMINDER: () => ({
      title: `Coming up: ${task.title}`,
      lines: [`Deadline: ${formatDeadline(task.deadline)}`],
    }),
  };
}

// Pure: given a notification type and its task (plus any extra context),
// returns { subject, html, text }. No I/O, no side effects -- everything
// that touches the network or the database lives in emailService /
// notificationService instead.
export function buildEmail(type, { task, ...extra }) {
  const builder = builders(task, extra)[type];
  if (!builder) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const { title, lines } = builder();
  const url = taskUrl(task);

  const html = [
    `<h2>${title}</h2>`,
    ...lines.map((line) => `<p>${line}</p>`),
    url ? `<p><a href="${url}">View task</a></p>` : '',
  ]
    .filter(Boolean)
    .join('');

  const text = [title, '', ...lines, ...(url ? ['', url] : [])].join('\n');

  return { subject: title, html, text };
}

// Pure, same inputs as buildEmail: returns the short { title, body, url }
// shape used by both push notifications and the in-app feed -- push and the
// feed share one shorter form of the copy rather than each inventing their
// own, since neither has room (or need) for email's fuller HTML body.
export function buildPush(type, { task, ...extra }) {
  const builder = builders(task, extra)[type];
  if (!builder) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const { title, lines } = builder();
  const url = taskUrl(task);

  return { title, body: lines.join(' '), url };
}
