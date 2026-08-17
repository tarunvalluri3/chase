import { supabase } from '../db/supabaseClient.js';

export async function findOrCreateByClerkUserId(clerkUserId) {
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ clerk_user_id: clerkUserId })
    .select('*')
    .single();

  if (insertError) {
    // Unique violation: another concurrent request created the row first.
    if (insertError.code === '23505') {
      const { data: raceWinner, error: refetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (refetchError) {
        throw refetchError;
      }

      return raceWinner;
    }

    throw insertError;
  }

  return created;
}
