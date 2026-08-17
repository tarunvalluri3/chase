import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';

describe('cross-cutting error handling', () => {
  it('a malformed JSON body is rejected with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .set('x-test-user-id', 'probe')
      .send('{not valid json');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBeDefined();
  });

  it('an unmatched route returns the API\'s JSON error shape, not an HTML page', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.type).toBe('application/json');
    expect(res.body.error.message).toBeDefined();
  });
});
