import { supabase } from '../db/supabaseClient.js';

export async function create(
  userId,
  { title, description, deadline, priority, reminder_enabled, repeat_rule, repeat_group_id },
) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      description,
      deadline,
      priority,
      reminder_enabled,
      repeat_rule,
      repeat_group_id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listByUser(userId, { status } = {}) {
  let query = supabase.from('tasks').select('*').eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function findByIdForUser(id, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function update(id, userId, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Guarded variant for the lazy ACTIVE -> MISSED check: conditions the write
// on the row still being ACTIVE, so a concurrent Complete/Delete that lands
// first is never silently overwritten back to MISSED. Returns null (rather
// than throwing) when the row no longer matched -- the caller re-reads the
// row's current state in that case.
export async function transitionToMissedIfActive(id, userId, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function sweepMissed(userId, { missedReason, now }) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'MISSED', missed_reason: missedReason, missed_at: now, updated_at: now })
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .lt('deadline', now)
    .select('*');

  if (error) {
    throw error;
  }

  return data;
}

// Cross-user version of sweepMissed, for the internal notification scheduler
// only (server-side, service-role client, never exposed via a route) --
// flips every user's overdue ACTIVE tasks to MISSED in one pass.
export async function sweepAllUsersMissed({ missedReason, now }) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'MISSED', missed_reason: missedReason, missed_at: now, updated_at: now })
    .eq('status', 'ACTIVE')
    .lt('deadline', now)
    .select('*');

  if (error) {
    throw error;
  }

  return data;
}

// ACTIVE tasks whose deadline falls between now and the given horizon --
// candidates for a deadline-approaching reminder. Internal/scheduler use
// only, not user-scoped.
export async function findActiveDueWithin({ now, until }) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'ACTIVE')
    .eq('reminder_enabled', true)
    .gte('deadline', now)
    .lte('deadline', until);

  if (error) {
    throw error;
  }

  return data;
}

// Unscoped lookup for internal/server-side use only (the notification
// scheduler and retry pass) -- every user-facing read still goes through
// findByIdForUser, which enforces ownership.
export async function findByIdInternal(id) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
