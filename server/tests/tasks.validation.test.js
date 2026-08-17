import { afterAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { taskPayload } from './helpers/fixtures.js';

describe('validation edge cases', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);
  const malformedId = 'not-a-uuid';

  afterAll(() => cleanupUser(userId));

  it.each([
    ['GET', `/api/tasks/${malformedId}`],
    ['PATCH', `/api/tasks/${malformedId}`],
    ['POST', `/api/tasks/${malformedId}/complete`],
    ['POST', `/api/tasks/${malformedId}/resolve-missed`],
    ['DELETE', `/api/tasks/${malformedId}`],
  ])('%s %s with a malformed id -> 400', async (method, url) => {
    const res = await user[method.toLowerCase()](url).send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/tasks?status=<invalid> -> 400', async () => {
    const res = await user.get('/api/tasks?status=NOT_A_STATUS');
    expect(res.status).toBe(400);
  });

  it('rejects create with a whitespace-only title', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ title: '   ' }));
    expect(res.status).toBe(400);
  });

  it('rejects edit with a whitespace-only title', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.patch(`/api/tasks/${created.body.id}`).send({ title: '  ' });
    expect(res.status).toBe(400);
  });
});
