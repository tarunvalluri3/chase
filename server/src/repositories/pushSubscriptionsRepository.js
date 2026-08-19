import { supabase } from '../db/supabaseClient.js';

// Upsert on endpoint: the Push API guarantees an endpoint URL is unique to
// one browser subscription, so re-subscribing the same device just refreshes
// the existing row (new keys, bumped last_seen_at) instead of accumulating
// duplicates.
export async function upsert(userId, { endpoint, p256dh, auth, userAgent }) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeByEndpoint(userId, endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) {
    throw error;
  }
}

// Used by pushService to prune a subscription the push service has reported
// as gone (404/410 on send) -- not scoped by user_id since the id alone
// already uniquely identifies the row and the caller isn't acting on behalf
// of an HTTP request at that point.
export async function removeById(id) {
  const { error } = await supabase.from('push_subscriptions').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function listByUser(userId) {
  const { data, error } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data;
}
