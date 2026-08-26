import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { clearDemoSession, createDemoAccount, getDemoSession, signInDemoAccount } from './demoAuth';

const AuthContext = createContext(null);

const IDENTITY_RETRY_DELAY_MS = 350;
const IDENTITY_RETRY_COUNT = 8;

const pause = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function loadIdentity(user, onProfileLoaded = () => {}) {
  if (!user || !supabase) return { profile: null, roles: [], identityStatus: 'unauthenticated' };
  // The Auth trigger writes profile + role immediately after auth.users. A
  // short retry keeps a brand-new account on its loading screen instead of
  // incorrectly presenting it as unauthorized during that transaction.
  for (let attempt = 0; attempt < IDENTITY_RETRY_COUNT; attempt += 1) {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (import.meta.env.DEV) console.info('[PROFILE] profile loaded', { userId: user.id, found: Boolean(profile), attempt });
    if (profile) {
      onProfileLoaded();
      const { data: grants, error: rolesError } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      if (rolesError) throw rolesError;
      const roles = [...new Set((grants ?? []).map((grant) => grant.role))];
      if (roles.length) {
        if (import.meta.env.DEV) console.info('[ROLE] roles returned from database', { userId: user.id, roles });
        return { profile, roles, identityStatus: 'ready' };
      }
      if (attempt === IDENTITY_RETRY_COUNT - 1) return { profile, roles: [], identityStatus: 'role_missing' };
    } else if (attempt === IDENTITY_RETRY_COUNT - 1) {
      return { profile: null, roles: [], identityStatus: 'profile_missing' };
    }
    await pause(IDENTITY_RETRY_DELAY_MS);
  }
  return { profile: null, roles: [], identityStatus: 'profile_missing' };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: isSupabaseConfigured, roleLoading: false, session: null, profile: null, roles: [], identityStatus: 'unauthenticated', error: null });
  const [demoAccount, setDemoAccount] = useState(() => getDemoSession());
  const requestIdRef = useRef(0);

  const loadSessionIdentity = async (session, isCurrent = () => true) => {
    if (!session?.user) {
      if (isCurrent()) setState({ loading: false, roleLoading: false, session: null, profile: null, roles: [], identityStatus: 'unauthenticated', error: null });
      return;
    }
    if (import.meta.env.DEV) console.info('[AUTH] authenticated user', { userId: session.user.id });
    // Do not leave an older account's roles rendered while this session loads.
    if (isCurrent()) setState({ loading: false, roleLoading: true, session, profile: null, roles: [], identityStatus: 'profile_loading', error: null });
    try {
      const identity = await loadIdentity(session.user, () => {
        if (isCurrent()) setState({ loading: false, roleLoading: true, session, profile: null, roles: [], identityStatus: 'role_loading', error: null });
      });
      if (isCurrent()) setState({ loading: false, roleLoading: false, session, ...identity, error: null });
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Lumora auth] identity load failed', { userId: session.user.id, message: error instanceof Error ? error.message : String(error) });
      if (isCurrent()) setState({ loading: false, roleLoading: false, session, profile: null, roles: [], identityStatus: 'load_error', error: error instanceof Error ? error.message : 'Unable to load Lumora identity.' });
    }
  };

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    const applySession = async (session) => {
      const requestId = ++requestIdRef.current;
      await loadSessionIdentity(session, () => mounted && requestId === requestIdRef.current);
    };
    supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch((error) => { if (mounted) setState({ loading: false, roleLoading: false, session: null, profile: null, roles: [], identityStatus: 'load_error', error: error.message }); });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => { mounted = false; subscription.subscription.unsubscribe(); };
  }, []);

  const activeDemo = !state.session && demoAccount;
  const demoUser = activeDemo ? { id: activeDemo.id, email: activeDemo.email, user_metadata: { display_name: activeDemo.displayName } } : null;
  const value = useMemo(() => ({
    ...state,
    session: activeDemo ? { user: demoUser, demo: true } : state.session,
    profile: activeDemo ? { id: activeDemo.id, display_name: activeDemo.displayName } : state.profile,
    roles: activeDemo ? [activeDemo.role] : state.roles,
    identityStatus: activeDemo ? 'ready' : state.identityStatus,
    loading: activeDemo ? false : state.loading,
    roleLoading: activeDemo ? false : state.roleLoading,
    isDemo: Boolean(activeDemo),
    configured: isSupabaseConfigured,
    authLoading: activeDemo ? false : state.loading,
    profileLoading: !activeDemo && state.roleLoading && state.identityStatus === 'profile_loading',
    ready: !state.loading && (!state.roleLoading || Boolean(activeDemo)) && (activeDemo || state.identityStatus === 'ready'),
    user: demoUser ?? state.session?.user ?? null,
    // profiles.display_name is canonical once the migration is installed.
    // Auth metadata preserves the signup name until that profile can be read.
    displayName: activeDemo?.displayName || state.profile?.display_name?.trim() || state.session?.user?.user_metadata?.display_name?.trim() || 'Learner',
    signOut: async () => {
      clearDemoSession();
      setDemoAccount(null);
      if (state.session) await supabase?.auth.signOut();
    },
    createDemoAccount: async (details) => {
      const account = await createDemoAccount(details);
      setDemoAccount(account);
      return account;
    },
    signInDemoAccount: async (details) => {
      const account = await signInDemoAccount(details);
      setDemoAccount(account);
      return account;
    },
    // The session from signInWithPassword lets this complete without waiting
    // for the asynchronous auth-state callback.
    refreshIdentity: async (session = state.session) => {
      const requestId = ++requestIdRef.current;
      await loadSessionIdentity(session, () => requestId === requestIdRef.current);
    },
  }), [activeDemo, demoAccount, demoUser, state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
