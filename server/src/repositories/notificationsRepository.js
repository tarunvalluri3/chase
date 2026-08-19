import { supabase } from '../db/supabaseClient.js';

// Attempts to claim a notification slot by inserting a PENDING row. The
// unique constraint on (task_id, type, dedup_key, channel) is what actually
// prevents a duplicate send: a 23505 violation here means this notification
// was already claimed or sent on this channel (by an earlier attempt,
// another process, or a prior server run before a restart), so the caller
// should just skip. `channel` defaults to 'EMAIL' -- push claims pass
// channel: 'PUSH' explicitly, tracked as an independent slot so a push
// failure can never block or dedupe against the email send for the same
// event, or vice versa. Returns the inserted row, or null if already claimed.
export async function claim({ userId, taskId, type, dedupKey, channel = 'EMAIL' }) {
  const { data, error } = await supabase
    .from('notification_log')
    .insert({ user_id: userId, task_id: taskId, type, dedup_key: dedupKey, channel, status: 'PENDING' })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return null;
    }
    throw error;
  }

  return data;
}

export async function markSent(id) {
  const { error } = await supabase
    .from('notification_log')
    .update({ status: 'SENT', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function markFailed(id, errorMessage, attempts) {
  const { error } = await supabase
    .from('notification_log')
    .update({
      status: 'FAILED',
      error_message: errorMessage,
      attempts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// FAILED rows under the attempt cap, oldest first -- picked up by the
// scheduler's retry pass. PENDING rows are deliberately not retried here:
// a PENDING row with no matching SENT/FAILED update means a send is either
// still in flight or the process died mid-send, and there's no reliable
// way to tell those apart from a second process; leaving it PENDING is
// safer than risking a duplicate send. (A future pass could add a
// claimed_at staleness check if this proves to be a real gap in practice.)
export async function findRetryable(maxAttempts) {
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('status', 'FAILED')
    .lt('attempts', maxAttempts)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
