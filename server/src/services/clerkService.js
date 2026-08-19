import { clerkClient } from '@clerk/express';

// Fetches a Clerk user's primary email address. Returns null rather than
// throwing on any lookup failure (unknown user, no email on the account,
// Clerk API error) -- callers treat "no email" as a normal, expected case,
// not an exceptional one.
export async function getUserEmail(clerkUserId) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    const addresses = user?.emailAddresses ?? [];
    const primary = addresses.find((address) => address.id === user.primaryEmailAddressId);
    return primary?.emailAddress ?? addresses[0]?.emailAddress ?? null;
  } catch (err) {
    console.error('clerkService.getUserEmail failed', { clerkUserId, err });
    return null;
  }
}
