import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/repositories/pushSubscriptionsRepository.js', () => ({
  removeById: vi.fn().mockResolvedValue(undefined),
}));

import webpush from 'web-push';
import * as pushSubscriptionsRepository from '../src/repositories/pushSubscriptionsRepository.js';
import { sendPush } from '../src/services/pushService.js';

const subscription = { id: 'sub-1', endpoint: 'https://push.example/abc', p256dh: 'key', auth: 'secret' };
const payload = { title: 'Completed: Ship it', body: 'Nice work.', url: 'https://chase.test/tasks/completed/1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pushService.sendPush', () => {
  it('sends the payload to the subscription and returns ok on success', async () => {
    webpush.sendNotification.mockResolvedValue({ statusCode: 201 });

    const result = await sendPush(subscription, payload);

    expect(result).toEqual({ ok: true });
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
    );
  });

  it('never throws and prunes the subscription on a 404', async () => {
    const err = new Error('Gone');
    err.statusCode = 404;
    webpush.sendNotification.mockRejectedValue(err);

    await expect(sendPush(subscription, payload)).resolves.toEqual({ ok: false, error: err });
    expect(pushSubscriptionsRepository.removeById).toHaveBeenCalledWith(subscription.id);
  });

  it('never throws and prunes the subscription on a 410', async () => {
    const err = new Error('Gone');
    err.statusCode = 410;
    webpush.sendNotification.mockRejectedValue(err);

    await expect(sendPush(subscription, payload)).resolves.toEqual({ ok: false, error: err });
    expect(pushSubscriptionsRepository.removeById).toHaveBeenCalledWith(subscription.id);
  });

  it('never throws and does not prune on a non-404/410 failure', async () => {
    const err = new Error('Push service unavailable');
    err.statusCode = 500;
    webpush.sendNotification.mockRejectedValue(err);

    await expect(sendPush(subscription, payload)).resolves.toEqual({ ok: false, error: err });
    expect(pushSubscriptionsRepository.removeById).not.toHaveBeenCalled();
  });
});
