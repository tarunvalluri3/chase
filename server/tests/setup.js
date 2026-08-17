import 'dotenv/config';
import { vi } from 'vitest';

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
}));
