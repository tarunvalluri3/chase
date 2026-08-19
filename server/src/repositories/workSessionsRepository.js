import { supabase } from '../db/supabaseClient.js';

export async function findOpenForTask(taskId) {
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('task_id', taskId)
    .is('ended_at', null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function findMostRecentForTask(taskId) {
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function create(taskId, userId) {
  const { data, error } = await supabase
    .from('work_sessions')
    .insert({ task_id: taskId, user_id: userId })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function close(id, endReason, endedAt) {
  const { data, error } = await supabase
    .from('work_sessions')
    .update({ ended_at: endedAt, end_reason: endReason, updated_at: endedAt })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listByTask(taskId) {
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('task_id', taskId)
    .order('started_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

// Cross-task, for Phase 20 analytics -- every prior method here is
// task-scoped only. `since` (an ISO timestamp) filters to segments that
// started at or after it; pass null/undefined for no lower bound (the
// 'all' range). Filtered on `started_at`, matching PHASE_20.md's rule that
// each metric filters on the timestamp field it's naturally keyed to.
export async function listByUserSince(userId, since) {
  let query = supabase.from('work_sessions').select('*').eq('user_id', userId);

  if (since) {
    query = query.gte('started_at', since);
  }

  const { data, error } = await query.order('started_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
