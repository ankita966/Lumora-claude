import { createClient } from '@supabase/supabase-js';

const rawUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL?.trim() : '';
const url = rawUrl?.replace(/\/+$/, '');
const anonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

export const supabaseConfigurationError = rawUrl && /\/(?:rest|auth)\/v1\/?$/i.test(rawUrl)
  ? 'VITE_SUPABASE_URL must be the project base URL (https://<project-ref>.supabase.co), not a /rest/v1 or /auth/v1 API endpoint.'
  : (anonKey && (anonKey.includes('PASTE_YOUR') || anonKey.includes('your-anon-key')))
    ? 'VITE_SUPABASE_ANON_KEY contains a placeholder value. Please paste your valid publishable key from Supabase Dashboard.'
    : null;
export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  !anonKey.includes('PASTE_YOUR') &&
  !anonKey.includes('your-anon-key') &&
  !supabaseConfigurationError
);
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
