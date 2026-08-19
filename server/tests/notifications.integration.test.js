import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/emailService.js', () => ({
  sendEmail: vi.fn(),
}));

import webpush from 'web-push';
import { sendEmail } from '../src/services/emailService.js';
import { supabase } from '../src/db/supabaseClient.js';
import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

async function findLog(taskId, type, channel = 'EMAIL') {
  const { data } = await supabase
    .from('notification_log')
    .select('*')
    .eq('task_id', taskId)
    .eq('type', type)
    .eq('channel', channel)
    .maybeSingle();
  return data;
}

describe('notifications: task operations never fail because email fails', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  beforeEach(() => {
    sendEmail.mockReset();
  });

  afterAll(() => cleanupUser(userId));

  it('creating a task succeeds and sends a TASK_CREATED email', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });

    const res = await user.post('/api/tasks').send(taskPayload());

    expect(res.status).toBe(201);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe(`${userId}@example.test`);

    const log = await findLog(res.body.id, 'TASK_CREATED');
    expect(log?.status).toBe('SENT');
  });

  it('creating a task still returns 201 when the email provider rejects', async () => {
    sendEmail.mockRejectedValue(new Error('Resend is down'));

    const res = await user.post('/api/tasks').send(taskPayload());

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(taskPayload().title);

    const log = await findLog(res.body.id, 'TASK_CREATED');
    expect(log?.status).toBe('FAILED');
    expect(log?.error_message).toContain('Resend is down');
  });

  it('completing a task still returns 200 when the email provider rejects', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload());

    sendEmail.mockRejectedValue(new Error('Resend is down'));
    const res = await user.post(`/api/tasks/${created.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('deleting a task still returns 200 when the email provider rejects', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload());

    sendEmail.mockRejectedValue(new Error('Resend is down'));
    const res = await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'not needed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELETED');
  });

  it('editing only the title (no deadline/priority change) sends no TASK_UPDATED email', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload());
    sendEmail.mockClear();

    const res = await user.patch(`/api/tasks/${created.body.id}`).send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('editing the deadline sends a TASK_UPDATED email', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload());
    sendEmail.mockClear();

    const newDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const res = await user.patch(`/api/tasks/${created.body.id}`).send({ deadline: newDeadline });

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const log = await findLog(created.body.id, 'TASK_UPDATED');
    expect(log?.status).toBe('SENT');
  });

  it('resolving MISSED -> INCOMPLETE sends a TASK_INCOMPLETE email', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    await user.get(`/api/tasks/${created.body.id}`); // triggers ACTIVE -> MISSED
    sendEmail.mockClear();

    const res = await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'never got to it' });

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const log = await findLog(created.body.id, 'TASK_INCOMPLETE');
    expect(log?.status).toBe('SENT');
  });

  it('the lazy ACTIVE -> MISSED check on GET never sends an email itself', async () => {
    sendEmail.mockResolvedValue({ id: 'ok' });
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    sendEmail.mockClear();

    const res = await user.get(`/api/tasks/${created.body.id}`);
    expect(res.body.status).toBe('MISSED');
    expect(sendEmail).not.toHaveBeenCalled();

    const log = await findLog(created.body.id, 'TASK_MISSED');
    expect(log).toBeNull();
  });
});

describe('notifications: task operations never fail because push fails', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ id: 'ok' });
    webpush.sendNotification.mockReset();
  });

  afterAll(() => cleanupUser(userId));

  // Ordered deliberately: this one runs before the user has any
  // subscriptions at all, since the later tests each add one.
  it('sends no push and creates no PUSH log row when the user has no subscriptions', async () => {
    webpush.sendNotification.mockResolvedValue({ statusCode: 201 });

    const res = await user.post('/api/tasks').send(taskPayload());

    expect(res.status).toBe(201);
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    const log = await findLog(res.body.id, 'TASK_CREATED', 'PUSH');
    expect(log).toBeNull();
  });

  it('creating a task still returns 201 and sends push to a subscribed device', async () => {
    await user
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://push.example.test/isolation-1', keys: { p256dh: 'k', auth: 's' } });
    webpush.sendNotification.mockResolvedValue({ statusCode: 201 });

    const res = await user.post('/api/tasks').send(taskPayload());

    expect(res.status).toBe(201);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);

    const log = await findLog(res.body.id, 'TASK_CREATED', 'PUSH');
    expect(log?.status).toBe('SENT');
  });

  it('creating a task still returns 201 when the push provider rejects', async () => {
    await user.delete('/api/push/subscribe').send({ endpoint: 'https://push.example.test/isolation-1' });
    await user
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://push.example.test/isolation-2', keys: { p256dh: 'k', auth: 's' } });
    webpush.sendNotification.mockRejectedValue(new Error('Push service unavailable'));

    const res = await user.post('/api/tasks').send(taskPayload());

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(taskPayload().title);

    const log = await findLog(res.body.id, 'TASK_CREATED', 'PUSH');
    expect(log?.status).toBe('FAILED');
  });
});
