import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/emailService.js', () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from '../src/services/emailService.js';
import { asUser, newClerkUserId, unauth } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { taskPayload } from './helpers/fixtures.js';

describe('GET /api/notifications', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ id: 'ok' });
  });

  afterAll(() => cleanupUser(userId));

  it('requires authentication', async () => {
    const res = await unauth().get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('lists a feed row for a task event, newest first', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'Feed task one' }));
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.get('/api/notifications');

    expect(res.status).toBe(200);
    const types = res.body.map((n) => n.type);
    expect(types).toContain('TASK_CREATED');
    expect(types).toContain('TASK_COMPLETED');
    // TASK_COMPLETED happened after TASK_CREATED, so it should sort first.
    expect(types.indexOf('TASK_COMPLETED')).toBeLessThan(types.indexOf('TASK_CREATED'));
  });

  it('is written even when email delivery fails, since the feed is unconditional', async () => {
    sendEmail.mockRejectedValue(new Error('Resend is down'));
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'Feed despite email failure' }));

    const res = await user.get('/api/notifications');
    expect(res.body.some((n) => n.task_id === created.body.id && n.type === 'TASK_CREATED')).toBe(true);
  });

  it('filters to unread only when requested', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'Unread filter task' }));
    const listRes = await user.get('/api/notifications');
    const row = listRes.body.find((n) => n.task_id === created.body.id);

    await user.post(`/api/notifications/${row.id}/read`);

    const unreadRes = await user.get('/api/notifications?unreadOnly=true');
    expect(unreadRes.body.some((n) => n.id === row.id)).toBe(false);
  });

  it('never returns another user\'s feed rows', async () => {
    const otherUserId = newClerkUserId();
    const other = asUser(otherUserId);
    await other.post('/api/tasks').send(taskPayload({ title: 'Someone else\'s task' }));

    const res = await user.get('/api/notifications');
    expect(res.body.every((n) => n.title !== "Someone else's task" && !n.title.includes("Someone else"))).toBe(true);

    await cleanupUser(otherUserId);
  });
});

describe('POST /api/notifications/:id/read and /read-all', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ id: 'ok' });
  });

  afterAll(() => cleanupUser(userId));

  it('marks a single notification read', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'Mark read task' }));
    const listRes = await user.get('/api/notifications');
    const row = listRes.body.find((n) => n.task_id === created.body.id);

    const res = await user.post(`/api/notifications/${row.id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.read_at).not.toBeNull();
  });

  it('404s marking another user\'s notification read', async () => {
    const otherUserId = newClerkUserId();
    const other = asUser(otherUserId);
    const created = await other.post('/api/tasks').send(taskPayload({ title: 'Foreign task' }));
    const otherList = await other.get('/api/notifications');
    const foreignRow = otherList.body.find((n) => n.task_id === created.body.id);

    const res = await user.post(`/api/notifications/${foreignRow.id}/read`);
    expect(res.status).toBe(404);

    await cleanupUser(otherUserId);
  });

  it('marks every unread row read via read-all', async () => {
    await user.post('/api/tasks').send(taskPayload({ title: 'Read-all task one' }));
    await user.post('/api/tasks').send(taskPayload({ title: 'Read-all task two' }));

    const res = await user.post('/api/notifications/read-all');
    expect(res.status).toBe(204);

    const unreadRes = await user.get('/api/notifications?unreadOnly=true');
    expect(unreadRes.body).toHaveLength(0);
  });
});
