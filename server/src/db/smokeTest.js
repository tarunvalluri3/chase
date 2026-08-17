import 'dotenv/config';

import { supabase } from './supabaseClient.js';

const { error, count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true });

if (error) {
  console.error('Supabase connectivity check failed:', error.message);
  process.exit(1);
}

console.log(`Supabase connectivity OK. users table reachable (row count: ${count}).`);
