import * as pushSubscriptionsRepository from '../repositories/pushSubscriptionsRepository.js';

export async function subscribe(userId, { endpoint, keys, userAgent }) {
  return pushSubscriptionsRepository.upsert(userId, {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    userAgent,
  });
}

export async function unsubscribe(userId, endpoint) {
  await pushSubscriptionsRepository.removeByEndpoint(userId, endpoint);
}

export function getVapidPublicKey() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('Missing VAPID_PUBLIC_KEY in environment');
  }
  return key;
}
