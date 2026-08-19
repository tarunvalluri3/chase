import * as usersRepository from '../repositories/usersRepository.js';
import * as clerkService from './clerkService.js';

// Finds or creates the internal user row for a Clerk identity, syncing its
// cached email from Clerk along the way: fetched once on first creation,
// and opportunistically backfilled on read for any pre-existing row that
// doesn't have one yet (covers users created before this cache existed).
export async function getOrCreateUser(clerkUserId) {
  const existing = await usersRepository.findByClerkUserId(clerkUserId);

  if (existing) {
    if (existing.email) {
      return existing;
    }

    const email = await clerkService.getUserEmail(clerkUserId);
    return email ? usersRepository.updateEmail(existing.id, email) : existing;
  }

  const email = await clerkService.getUserEmail(clerkUserId);
  return usersRepository.create(clerkUserId, email);
}
