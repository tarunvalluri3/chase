import { afterAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

describe('completion', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('ACTIVE -> COMPLETED sets status and completed_at', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.post(`/api/tasks/${created.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.completed_at).toBeDefined();
    expect(res.body.completed_at).not.toBeNull();
  });

  it('re-completing an already-COMPLETED task fails', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.post(`/api/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(409);
  });

  it('completing a DELETED task fails', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'no longer needed' });

    const res = await user.post(`/api/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(409);
  });
});

describe('deletion', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('requires a non-empty reason', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.delete(`/api/tasks/${created.body.id}`).send({ reason: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a missing reason', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.delete(`/api/tasks/${created.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('soft-deletes: status=DELETED, reason stored, row still readable by owner', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user
      .delete(`/api/tasks/${created.body.id}`)
      .send({ reason: 'changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELETED');
    expect(res.body.deletion_reason).toBe('changed my mind');
    expect(res.body.deleted_at).not.toBeNull();

    const getRes = await user.get(`/api/tasks/${created.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('DELETED');
  });

  it('rejects deleting a non-ACTIVE task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'too late' });
    expect(res.status).toBe(409);
  });
});

describe('automatic missed detection', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('an ACTIVE task past its deadline becomes MISSED on GET (list)', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    expect(created.body.status).toBe('ACTIVE');

    const res = await user.get('/api/tasks');
    const found = res.body.find((task) => task.id === created.body.id);

    expect(found.status).toBe('MISSED');
    expect(found.missed_reason).toBeTruthy();
    expect(found.missed_at).not.toBeNull();
  });

  it('an ACTIVE task past its deadline becomes MISSED on GET (single)', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    const res = await user.get(`/api/tasks/${created.body.id}`);

    expect(res.body.status).toBe('MISSED');
    expect(res.body.missed_reason).toBeTruthy();
  });

  it('is not treated as a verdict of "never completed" -- it is only a checkpoint', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    const res = await user.get(`/api/tasks/${created.body.id}`);

    expect(res.body.status).toBe('MISSED');
    expect(res.body.incomplete_reason).toBeNull();
    expect(res.body.incomplete_at).toBeNull();
  });

  it('an already-MISSED task is not reprocessed on subsequent reads', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    const first = await user.get(`/api/tasks/${created.body.id}`);
    expect(first.body.status).toBe('MISSED');

    const second = await user.get(`/api/tasks/${created.body.id}`);
    expect(second.body.status).toBe('MISSED');
    expect(second.body.missed_at).toBe(first.body.missed_at);
  });

  it('a COMPLETED task past its deadline is left untouched by reads', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.get(`/api/tasks/${created.body.id}`);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('a DELETED task past its deadline is left untouched by reads', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'not needed anymore' });

    const res = await user.get(`/api/tasks/${created.body.id}`);
    expect(res.body.status).toBe('DELETED');
  });

  it('there is no client-facing way to set status=MISSED directly', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ status: 'MISSED' }));
    expect(res.status).toBe(400);
  });

  it('there is no /miss endpoint', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.post(`/api/tasks/${created.body.id}/miss`);
    expect(res.status).toBe(404);
  });

  it('sweep-missed bulk-transitions eligible ACTIVE+overdue tasks and nothing else', async () => {
    const overdue = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    const stillActive = await user.post('/api/tasks').send(taskPayload());

    const res = await user.post('/api/tasks/sweep-missed');
    expect(res.status).toBe(200);
    expect(res.body.some((task) => task.id === overdue.body.id && task.status === 'MISSED')).toBe(
      true,
    );
    expect(res.body.some((task) => task.id === stillActive.body.id)).toBe(false);

    const check = await user.get(`/api/tasks/${stillActive.body.id}`);
    expect(check.body.status).toBe('ACTIVE');
  });
});

describe('resolve-missed', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  async function createMissedTask() {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    await user.get(`/api/tasks/${created.body.id}`); // triggers ACTIVE -> MISSED
    return created.body.id;
  }

  it('rejects resolve-missed on a task that is still ACTIVE', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });
    expect(res.status).toBe(409);
  });

  it('rejects resolve-missed on a COMPLETED task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.post(`/api/tasks/${created.body.id}/complete`);
    const res = await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });
    expect(res.status).toBe(409);
  });

  it('rejects resolve-missed on a DELETED task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'cancelled' });
    const res = await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });
    expect(res.status).toBe(409);
  });

  it('resolve-missed lazily transitions an overdue ACTIVE task to MISSED first, then resolves it in the same call', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    const res = await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.missed_at).not.toBeNull();
  });

  it('rejects INCOMPLETE resolution without a reason', async () => {
    const id = await createMissedTask();
    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE' });
    expect(res.status).toBe(400);
  });

  it('rejects INCOMPLETE resolution with an empty/whitespace reason', async () => {
    const id = await createMissedTask();
    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid resolution value', async () => {
    const id = await createMissedTask();
    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'MAYBE' });
    expect(res.status).toBe(400);
  });

  it('rejects a missing resolution', async () => {
    const id = await createMissedTask();
    const res = await user.post(`/api/tasks/${id}/resolve-missed`).send({});
    expect(res.status).toBe(400);
  });

  it('rejects a stray reason alongside resolution=COMPLETED', async () => {
    const id = await createMissedTask();
    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'COMPLETED', reason: 'should not be here' });
    expect(res.status).toBe(400);
  });

  it('resolution=INCOMPLETE with a valid reason moves to INCOMPLETE and preserves missed_reason/missed_at', async () => {
    const id = await createMissedTask();
    const before = await user.get(`/api/tasks/${id}`);

    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'Actually never got to it' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCOMPLETE');
    expect(res.body.incomplete_reason).toBe('Actually never got to it');
    expect(res.body.incomplete_at).not.toBeNull();
    expect(res.body.missed_reason).toBe(before.body.missed_reason);
    expect(res.body.missed_at).toBe(before.body.missed_at);
  });

  it('resolution=COMPLETED moves to COMPLETED, sets completed_at, preserves missed history, leaves incomplete fields null', async () => {
    const id = await createMissedTask();
    const before = await user.get(`/api/tasks/${id}`);

    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.completed_at).not.toBeNull();
    expect(res.body.missed_reason).toBe(before.body.missed_reason);
    expect(res.body.missed_at).toBe(before.body.missed_at);
    expect(res.body.incomplete_reason).toBeNull();
    expect(res.body.incomplete_at).toBeNull();
  });

  it('resolving twice is rejected the second time (INCOMPLETE is terminal)', async () => {
    const id = await createMissedTask();
    await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'never done' });

    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'trying again' });
    expect(res.status).toBe(409);
  });

  it('resolving twice is rejected the second time (COMPLETED is terminal)', async () => {
    const id = await createMissedTask();
    await user.post(`/api/tasks/${id}/resolve-missed`).send({ resolution: 'COMPLETED' });

    const res = await user
      .post(`/api/tasks/${id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });
    expect(res.status).toBe(409);
  });
});
