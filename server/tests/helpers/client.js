import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '../../src/app.js';

// Prefixed so cleanup helpers can find (and remove) every row a test run
// created without touching real user data in the shared Supabase project.
export const TEST_CLERK_PREFIX = 'test-clerk-';

export function newClerkUserId() {
  return `${TEST_CLERK_PREFIX}${randomUUID()}`;
}

// Returns a supertest agent-like helper that stamps every request with the
// given Clerk user id, standing in for an authenticated session.
export function asUser(clerkUserId) {
  const withHeader = (req) => req.set('x-test-user-id', clerkUserId);

  return {
    get: (url) => withHeader(request(app).get(url)),
    post: (url) => withHeader(request(app).post(url)),
    patch: (url) => withHeader(request(app).patch(url)),
    delete: (url) => withHeader(request(app).delete(url)),
  };
}

export function unauth() {
  return request(app);
}
