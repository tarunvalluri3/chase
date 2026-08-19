import { pushApi } from './apiClient';

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Registered lazily, only when the user actually opts in (§5 of
// PHASE_18.md) -- never on every app load.
export async function registerServiceWorker() {
  if (!isPushSupported()) {
    return null;
  }
  return navigator.serviceWorker.register('/sw.js');
}

// The Push API wants the VAPID public key as a raw Uint8Array, not the
// base64url string the server hands back.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// 'granted' | 'denied' | 'default' | 'unsupported' -- lets callers (the
// Profile toggle) render the right state without triggering a prompt.
export function getPushPermissionState() {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function isSubscribed() {
  if (!isPushSupported()) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration) {
    return false;
  }
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}

// Requests OS permission (must be called from a user gesture -- the
// Profile toggle or the Home banner's own button, never on page load),
// registers the service worker, subscribes via the Push API, and tells the
// server about the new subscription.
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const registration = await registerServiceWorker();
  const { publicKey } = await pushApi.getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await pushApi.subscribe({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent });

  return subscription;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) {
    return;
  }
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  await pushApi.unsubscribe(endpoint);
}
