export function emailRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  const url = new URL(window.location.origin);
  url.searchParams.set('auth', 'verify');
  return url.toString();
}

export function verificationCallbackStatus() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (params.get('auth') !== 'verify') return null;
  if (params.get('error') || params.get('error_code') || hashParams.get('error') || hashParams.get('error_code')) return 'invalid';
  return 'success';
}
