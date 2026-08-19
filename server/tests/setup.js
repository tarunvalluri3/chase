import 'dotenv/config';
import { vi } from 'vitest';

// Notification-related env vars: only set a fallback if the real .env
// doesn't already define one, so a developer's real Resend config (if any)
// still takes effect, but the suite works without one -- Resend itself is
// mocked below regardless, so no real email is ever sent either way.
process.env.RESEND_API_KEY ||= 'test-resend-api-key';
process.env.RESEND_FROM_EMAIL ||= 'notifications@chase.test';
process.env.CLIENT_URL ||= 'http://localhost:5173';
process.env.VAPID_PUBLIC_KEY ||= 'test-vapid-public-key';
process.env.VAPID_PRIVATE_KEY ||= 'test-vapid-private-key';
process.env.VAPID_SUBJECT ||= 'mailto:test@chase.test';

// Test-only stand-in for @clerk/express so the suite never makes real Clerk
// network calls. A request is "authenticated" by setting the
// `x-test-user-id` header to an arbitrary Clerk user id string; the mocked
// middleware copies it onto req.auth exactly like the real Clerk middleware
// would after verifying a real session token.
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, _res, next) => {
    const userId = req.headers['x-test-user-id'];
    req.auth = userId ? { userId } : {};
    next();
  },
  getAuth: (req) => req.auth ?? {},
  // Backs clerkService.getUserEmail -- returns a deterministic fake email
  // per test Clerk id so notification tests can exercise real send/dedup
  // logic without any real Clerk network call.
  clerkClient: {
    users: {
      getUser: vi.fn(async (clerkUserId) => ({
        primaryEmailAddressId: 'idn_test',
        emailAddresses: [{ id: 'idn_test', emailAddress: `${clerkUserId}@example.test` }],
      })),
    },
  },
}));

// Resend is fully mocked so the suite never sends a real email -- every
// call succeeds by default; individual tests can override the mock's
// resolved/rejected value to exercise the failure path.
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(async () => ({ data: { id: 'test-email-id' }, error: null })),
    },
  })),
}));

// web-push is fully mocked so the suite never sends a real push -- every
// call succeeds by default; individual tests can override sendNotification's
// resolved/rejected value to exercise the failure/expired-subscription
// paths.
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async () => ({ statusCode: 201 })),
  },
}));
