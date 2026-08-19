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
