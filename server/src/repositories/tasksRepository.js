import { supabase } from '../db/supabaseClient.js';

export async function create(userId, { title, description, deadline, priority }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, description, deadline, priority })
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
