import { clerkMiddleware, getAuth } from '@clerk/express';

// Populates `req.auth` (if a valid Clerk session is present) without
// rejecting the request. Must be applied before `requireAuthenticated`.
export const withClerkAuth = clerkMiddleware();

// Rejects requests with no valid Clerk session with a generic 401 JSON
// error. On success, downstream handlers can read `getAuth(req).userId`
// for the Clerk user id. Later phases will map that id to an internal
// `users.id` row (users.clerk_user_id -> users.id) once Phase 2 adds the
// database; no DB lookup happens here yet.
export function requireAuthenticated(req, res, next) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized',
      },
    });
  }

  return next();
}

export { getAuth };
