import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

describe('status filtering', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);
  const ids = {};

  beforeAll(async () => {
    const active = await user.post('/api/tasks').send(taskPayload({ title: 'active-one' }));
    ids.ACTIVE = active.body.id;

    const completed = await user.post('/api/tasks').send(taskPayload({ title: 'completed-one' }));
    await user.post(`/api/tasks/${completed.body.id}/complete`);
    ids.COMPLETED = completed.body.id;

    const deleted = await user.post('/api/tasks').send(taskPayload({ title: 'deleted-one' }));
    await user.delete(`/api/tasks/${deleted.body.id}`).send({ reason: 'not needed' });
    ids.DELETED = deleted.body.id;

    const missed = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'missed-one', deadline: pastDeadline() }));
    await user.get(`/api/tasks/${missed.body.id}`); // trigger ACTIVE -> MISSED
    ids.MISSED = missed.body.id;

    const incomplete = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'incomplete-one', deadline: pastDeadline() }));
    await user
      .post(`/api/tasks/${incomplete.body.id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'genuinely never done' });
    ids.INCOMPLETE = incomplete.body.id;
  });

  afterAll(() => cleanupUser(userId));

  it.each(['ACTIVE', 'COMPLETED', 'DELETED', 'MISSED', 'INCOMPLETE'])(
    '?status=%s returns exactly the tasks in that status',
    async (status) => {
      const res = await user.get(`/api/tasks?status=${status}`);
      expect(res.status).toBe(200);

      const returnedIds = res.body.map((task) => task.id);
      expect(returnedIds).toContain(ids[status]);

      for (const [otherStatus, otherId] of Object.entries(ids)) {
        if (otherStatus !== status) {
          expect(returnedIds).not.toContain(otherId);
        }
      }

      for (const task of res.body) {
        if (Object.values(ids).includes(task.id)) {
          expect(task.status).toBe(status);
        }
      }
    },
  );

  it('an unfiltered list includes tasks in every status', async () => {
    const res = await user.get('/api/tasks');
    const returnedIds = res.body.map((task) => task.id);

    for (const id of Object.values(ids)) {
      expect(returnedIds).toContain(id);
    }
  });
});
