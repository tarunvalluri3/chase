import { describe, expect, it } from 'vitest';

import { buildEmail, buildPush } from '../src/services/notificationTemplates.js';

const baseTask = {
  id: 'task-1',
  title: 'Ship the report',
  status: 'ACTIVE',
  deadline: '2026-08-20T10:00:00.000Z',
  priority: 'HIGH',
  incomplete_reason: null,
  deletion_reason: null,
};

describe('notificationTemplates.buildEmail', () => {
  it('builds a TASK_CREATED email with the title, deadline, and priority', () => {
    const { subject, html, text } = buildEmail('TASK_CREATED', { task: baseTask });

    expect(subject).toContain(baseTask.title);
    expect(html).toContain('HIGH');
    expect(text).toContain('HIGH');
  });

  it('interpolates the incomplete reason into TASK_INCOMPLETE', () => {
    const task = { ...baseTask, incomplete_reason: 'Ran out of time' };
    const { html, text } = buildEmail('TASK_INCOMPLETE', { task });

    expect(html).toContain('Ran out of time');
    expect(text).toContain('Ran out of time');
  });

  it('interpolates the deletion reason into TASK_DELETED', () => {
    const task = { ...baseTask, deletion_reason: 'No longer needed' };
    const { html, text } = buildEmail('TASK_DELETED', { task });

    expect(html).toContain('No longer needed');
    expect(text).toContain('No longer needed');
  });

  it('lists changed fields on TASK_UPDATED when provided', () => {
    const { html } = buildEmail('TASK_UPDATED', { task: baseTask, changedFields: ['deadline'] });
    expect(html).toContain('Changed: deadline');
  });

  it('omits the "Changed" line on TASK_UPDATED when no fields are given', () => {
    const { html } = buildEmail('TASK_UPDATED', { task: baseTask });
    expect(html).not.toContain('Changed:');
  });

  it('builds a DEADLINE_REMINDER email referencing the deadline', () => {
    const { subject, html } = buildEmail('DEADLINE_REMINDER', { task: baseTask });
    expect(subject).toContain(baseTask.title);
    expect(html).toMatch(/Deadline/);
  });

  it('builds a TASK_MISSED email that never implies "never completed"', () => {
    const { html } = buildEmail('TASK_MISSED', { task: baseTask });
    expect(html).not.toMatch(/never completed/i);
    expect(html).toMatch(/confirm/i);
  });

  it('includes a task link when CLIENT_URL is set', () => {
    const { html, text } = buildEmail('TASK_COMPLETED', { task: baseTask });
    expect(html).toContain(process.env.CLIENT_URL);
    expect(text).toContain(process.env.CLIENT_URL);
  });

  it('throws on an unknown notification type', () => {
    expect(() => buildEmail('NOT_A_TYPE', { task: baseTask })).toThrow();
  });
});

describe('notificationTemplates.buildPush', () => {
  it('builds a short { title, body, url } shape', () => {
    const { title, body, url } = buildPush('TASK_CREATED', { task: baseTask });

    expect(title).toContain(baseTask.title);
    expect(body).toContain('HIGH');
    expect(url).toContain(process.env.CLIENT_URL);
  });

  it('interpolates the incomplete reason into TASK_INCOMPLETE', () => {
    const task = { ...baseTask, incomplete_reason: 'Ran out of time' };
    const { body } = buildPush('TASK_INCOMPLETE', { task });
    expect(body).toContain('Ran out of time');
  });

  it('never implies "never completed" for TASK_MISSED, same as the email copy', () => {
    const { body } = buildPush('TASK_MISSED', { task: baseTask });
    expect(body).not.toMatch(/never completed/i);
    expect(body).toMatch(/confirm/i);
  });

  it('throws on an unknown notification type', () => {
    expect(() => buildPush('NOT_A_TYPE', { task: baseTask })).toThrow();
  });
});
