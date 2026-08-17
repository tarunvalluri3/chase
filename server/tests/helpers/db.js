import { supabase } from '../../src/db/supabaseClient.js';

// Direct-to-Supabase cleanup, bypassing the API on purpose: tests need to
// remove tasks regardless of their lifecycle state (terminal states can't
// be deleted through the API by design), so real test data never lingers
// in the shared project past the test run that created it.
export async function cleanupUser(clerkUserId) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (!user) {
    return;
  }

  await supabase.from('tasks').delete().eq('user_id', user.id);
  await supabase.from('users').delete().eq('id', user.id);
}
