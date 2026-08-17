import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { taskPayload } from './helpers/fixtures.js';

describe('authorization: cross-user access is blocked and ownership-scoped', () => {
  const owner = newClerkUserId();
  const intruder = newClerkUserId();
  let taskId;

  beforeAll(async () => {
    const res = await asUser(owner).post('/api/tasks').send(taskPayload());
    taskId = res.body.id;
  });

  afterAll(async () => {
    await cleanupUser(owner);
    await cleanupUser(intruder);
  });

  it('owner can read their own task', async () => {
    const res = await asUser(owner).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
  });

  it('a foreign user gets a not-found response reading the task, identical in shape to a truly nonexistent id', async () => {
    const nonexistentId = '11111111-1111-4111-8111-111111111111';

    const foreignRes = await asUser(intruder).get(`/api/tasks/${taskId}`);
    const nonexistentRes = await asUser(intruder).get(`/api/tasks/${nonexistentId}`);

    expect(foreignRes.status).toBe(404);
    expect(nonexistentRes.status).toBe(404);
    expect(foreignRes.body).toEqual(nonexistentRes.body);
  });

  it('a foreign user cannot edit the task', async () => {
    const res = await asUser(intruder).patch(`/api/tasks/${taskId}`).send({ title: 'hijacked' });
    expect(res.status).toBe(404);
  });

  it('a foreign user cannot complete the task', async () => {
    const res = await asUser(intruder).post(`/api/tasks/${taskId}/complete`);
    expect(res.status).toBe(404);
  });

  it('a foreign user cannot resolve-missed the task', async () => {
    const res = await asUser(intruder)
      .post(`/api/tasks/${taskId}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });
    expect(res.status).toBe(404);
  });

  it('a foreign user cannot delete the task', async () => {
    const res = await asUser(intruder)
      .delete(`/api/tasks/${taskId}`)
      .send({ reason: 'not mine to delete' });
    expect(res.status).toBe(404);
  });

  it("a foreign user's task list never includes the owner's task", async () => {
    const res = await asUser(intruder).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.find((task) => task.id === taskId)).toBeUndefined();
  });

  it('the task still exists untouched after every rejected cross-user attempt', async () => {
    const res = await asUser(owner).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.title).toBe('Test task');
  });
});
