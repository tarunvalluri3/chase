import { supabase } from '../db/supabaseClient.js';

export async function findByClerkUserId(clerkUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function findById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function create(clerkUserId, email) {
  const { data, error } = await supabase
    .from('users')
    .insert({ clerk_user_id: clerkUserId, email: email ?? null })
    .select('*')
    .single();

  if (error) {
    // Unique violation: another concurrent request created the row first.
    if (error.code === '23505') {
      return findByClerkUserId(clerkUserId);
    }

    throw error;
  }

  return data;
}

export async function updateEmail(id, email) {
  const { data, error } = await supabase
    .from('users')
    .update({ email, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
