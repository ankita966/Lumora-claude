import { supabase } from '../lib/supabase';

// The database function independently verifies school_admin before reading
// auth.users fields. The browser only has the anonymous key.
export async function loadRegisteredUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_registered_users');
  if (error) throw error;
  return data ?? [];
}

// RLS limits this list to schools where the signed-in administrator is a member.
export async function loadAdminSchools() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('schools').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

// This invokes the protected Edge Function; it never assigns roles in the browser.
export async function provisionUser(invitation) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('provision-user', { body: invitation });
  if (!error) return data;

  let message = 'The provisioning service is unavailable. Please try again later.';
  if (error.context?.json) {
    const payload = await error.context.json().catch(() => null);
    if (payload?.error) message = payload.error;
  }
  throw new Error(message);
}
