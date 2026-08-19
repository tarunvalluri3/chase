import webpush from 'web-push';

import * as pushSubscriptionsRepository from '../repositories/pushSubscriptionsRepository.js';

let configured = false;

function ensureConfigured() {
  if (configured) {
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error('Missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT in environment');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

// Thin wrapper around web-push: sends one payload to one subscription.
// Never throws past its own boundary -- unlike emailService.sendEmail
// (which throws and leaves the decision to its caller), an expired/revoked
// subscription needs a side effect (pruning the row) no caller should have
// to know about, so this module owns that decision itself and always
// returns a result object instead.
export async function sendPush(subscription, { title, body, url }) {
  try {
    ensureConfigured();

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ title, body, url }),
    );

    return { ok: true };
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Push service reports the subscription is gone (browser
      // unsubscribed, or the subscription simply expired) -- prune it so
      // future sends don't keep failing against a dead endpoint.
      await pushSubscriptionsRepository.removeById(subscription.id).catch(() => {});
    } else {
      console.error('pushService.sendPush failed', { endpoint: subscription.endpoint, err });
    }

    return { ok: false, error: err };
  }
}
