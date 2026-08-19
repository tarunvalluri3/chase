import { supabase } from '../db/supabaseClient.js';

// The in-app feed: one row per event, always inserted regardless of whether
// email/push delivery succeeded -- unlike notification_log, this isn't a
// delivery attempt that can fail and need retrying, so there's no
// claim/dedup dance here.
export async function create({ userId, taskId, type, title, body }) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, task_id: taskId, type, title, body });

  if (error) {
    throw error;
  }
}

export async function listByUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

// Scoped by user_id so a foreign notification id can never be marked read --
// returns null (not an error) when nothing matched, letting the caller
// decide that means "not found" without a Supabase-specific error to parse.
// Deliberately not filtered on read_at being null: marking an
// already-read notification read again is idempotent, not a 404.
export async function markRead(id, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    throw error;
  }
}
