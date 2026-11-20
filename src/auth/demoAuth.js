/**
 * Deprecated: Demo & Sandbox authentication has been completely removed in production.
 * All accounts must authenticate via Supabase.
 */

export function getDemoSession() {
  return null;
}

export function clearDemoSession() {}

export function listDemoAccounts() {
  return [];
}
