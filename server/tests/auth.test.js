import { describe, expect, it } from 'vitest';

import { unauth } from './helpers/client.js';

const FAKE_ID = '00000000-0000-0000-0000-000000000000';

describe('auth: unauthenticated requests are rejected on every task route', () => {
  it.each([
    ['POST', '/api/tasks'],
    ['GET', '/api/tasks'],
    ['GET', `/api/tasks/${FAKE_ID}`],
    ['PATCH', `/api/tasks/${FAKE_ID}`],
    ['POST', `/api/tasks/${FAKE_ID}/complete`],
    ['POST', `/api/tasks/${FAKE_ID}/resolve-missed`],
    ['DELETE', `/api/tasks/${FAKE_ID}`],
    ['POST', '/api/tasks/sweep-missed'],
  ])('%s %s -> 401', async (method, url) => {
    const res = await unauth()[method.toLowerCase()](url).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBeDefined();
  });
});
