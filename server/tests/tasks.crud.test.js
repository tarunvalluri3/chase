import { afterAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { taskPayload } from './helpers/fixtures.js';

describe('task creation', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('creates a task with valid input', async () => {
    const payload = taskPayload({ title: 'Write tests' });
    const res = await user.post('/api/tasks').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Write tests',
      description: payload.description,
      priority: 'MEDIUM',
      status: 'ACTIVE',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.completed_at).toBeNull();
    expect(res.body.deleted_at).toBeNull();
    expect(res.body.missed_at).toBeNull();
  });

  it('rejects a missing title with 400', async () => {
    const { title, ...rest } = taskPayload();
    const res = await user.post('/api/tasks').send(rest);
    expect(res.status).toBe(400);
  });

  it('rejects an invalid priority with 400', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ priority: 'URGENT' }));
    expect(res.status).toBe(400);
  });

  it('rejects a malformed deadline with 400', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ deadline: 'not-a-date' }));
    expect(res.status).toBe(400);
  });

  it('rejects an attempt to set a system-controlled field with 400', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ status: 'COMPLETED' }));
    expect(res.status).toBe(400);
  });
});

describe('listing and getting tasks', () => {
  const ownerId = newClerkUserId();
  const otherId = newClerkUserId();
  const owner = asUser(ownerId);
  const other = asUser(otherId);

  afterAll(async () => {
    await cleanupUser(ownerId);
    await cleanupUser(otherId);
  });

  it("only returns the requesting user's tasks", async () => {
    const mine = await owner.post('/api/tasks').send(taskPayload({ title: 'mine' }));
    await other.post('/api/tasks').send(taskPayload({ title: 'theirs' }));

    const res = await owner.get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.every((task) => task.id !== undefined)).toBe(true);
    expect(res.body.some((task) => task.id === mine.body.id)).toBe(true);
    expect(res.body.some((task) => task.title === 'theirs')).toBe(false);
  });

  it('gets a single task by id', async () => {
    const created = await owner.post('/api/tasks').send(taskPayload({ title: 'get-me' }));
    const res = await owner.get(`/api/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('get-me');
  });

  it('returns a consistent 404 for a nonexistent id', async () => {
    const res = await owner.get('/api/tasks/22222222-2222-4222-8222-222222222222');
    expect(res.status).toBe(404);
  });
});

describe('editing tasks', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('updates allowed fields on an ACTIVE task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'before' }));
    const res = await user
      .patch(`/api/tasks/${created.body.id}`)
      .send({ title: 'after', priority: 'HIGH' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('after');
    expect(res.body.priority).toBe('HIGH');
    expect(res.body.status).toBe('ACTIVE');
  });

  it('rejects an empty edit body with 400', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.patch(`/api/tasks/${created.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('rejects an attempt to set a system-controlled field with 400', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user
      .patch(`/api/tasks/${created.body.id}`)
      .send({ status: 'COMPLETED', user_id: 'x' });
    expect(res.status).toBe(400);
  });

  it('rejects editing a non-ACTIVE task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.patch(`/api/tasks/${created.body.id}`).send({ title: 'too late' });
    expect(res.status).toBe(409);
  });
});
