import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { supabase } from '../src/db/supabaseClient.js';
import { asUser, newClerkUserId, unauth } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';

function subscriptionPayload(overrides = {}) {
  return {
    endpoint: `https://push.example.test/${randomUUID()}`,
    keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-secret' },
    ...overrides,
  };
}

async function findSubscription(endpoint) {
  const { data } = await supabase.from('push_subscriptions').select('*').eq('endpoint', endpoint).maybeSingle();
  return data;
}

describe('GET /api/push/vapid-public-key', () => {
  it('returns the configured public key without requiring auth', async () => {
    const res = await unauth().get('/api/push/vapid-public-key');
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBe(process.env.VAPID_PUBLIC_KEY);
  });
});

describe('POST /api/push/subscribe', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('requires authentication', async () => {
    const res = await unauth().post('/api/push/subscribe').send(subscriptionPayload());
    expect(res.status).toBe(401);
  });

  it('rejects a body missing keys', async () => {
    const res = await user.post('/api/push/subscribe').send({ endpoint: 'https://push.example.test/x' });
    expect(res.status).toBe(400);
  });

  it('creates a subscription for the authenticated user', async () => {
    const payload = subscriptionPayload();
    const res = await user.post('/api/push/subscribe').send(payload);

    expect(res.status).toBe(204);
    const row = await findSubscription(payload.endpoint);
    expect(row).not.toBeNull();
    expect(row.p256dh).toBe(payload.keys.p256dh);
  });

  it('upserts (not duplicates) when the same endpoint subscribes again', async () => {
    const payload = subscriptionPayload();
    await user.post('/api/push/subscribe').send(payload);
    const res = await user
      .post('/api/push/subscribe')
      .send({ ...payload, keys: { p256dh: 'updated-key', auth: payload.keys.auth } });

    expect(res.status).toBe(204);
    const { data } = await supabase.from('push_subscriptions').select('*').eq('endpoint', payload.endpoint);
    expect(data).toHaveLength(1);
    expect(data[0].p256dh).toBe('updated-key');
  });
});

describe('DELETE /api/push/subscribe', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('removes the caller\'s own subscription', async () => {
    const payload = subscriptionPayload();
    await user.post('/api/push/subscribe').send(payload);

    const res = await user.delete('/api/push/subscribe').send({ endpoint: payload.endpoint });
    expect(res.status).toBe(204);
    expect(await findSubscription(payload.endpoint)).toBeNull();
  });

  it('cannot remove another user\'s subscription', async () => {
    const otherUserId = newClerkUserId();
    const other = asUser(otherUserId);
    const payload = subscriptionPayload();
    await other.post('/api/push/subscribe').send(payload);

    const res = await user.delete('/api/push/subscribe').send({ endpoint: payload.endpoint });
    expect(res.status).toBe(204); // no-op, not an error -- matches DELETE's idempotent semantics elsewhere in the API
    expect(await findSubscription(payload.endpoint)).not.toBeNull();

    await cleanupUser(otherUserId);
  });
});
