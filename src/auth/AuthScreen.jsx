import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { authorizedPortal, ROLE_PORTALS } from './roleRouting';

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function loginErrorMessage(error) {
  if (/invalid login credentials|invalid.*password/i.test(error?.message ?? '')) return 'Incorrect email or password.';
  return 'Unable to sign you in. Please try again.';
}

export default function AuthScreen() {
  const { setScreen, authMode, setAuthMode, authPortal, setAuthPortal } = useGameStore();
  const { user, roles, roleLoading, identityStatus, error: identityError, refreshIdentity, signOut, createDemoAccount, signInDemoAccount } = useAuth();
  const [mode, setMode] = useState(authMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [busy, setBusy] = useState(false);
  const [mismatch, setMismatch] = useState(null);
  const portal = ROLE_PORTALS[authPortal];
  const signup = mode === 'signup';

  useEffect(() => {
    if (!user || roleLoading || identityError) return;
    if (identityStatus === 'profile_missing') {
      setMismatch({ kind: 'profile_missing', label: 'Profile not found' });
      return;
    }
    if (identityStatus === 'role_missing') {
      setMismatch({ kind: 'role_missing', label: 'Student role not found' });
      return;
    }
    const destination = authorizedPortal(roles);
    if (!destination) {
      setMismatch({ kind: 'role_missing', label: 'No Lumora portal role' });
      return;
    }
    if (portal && destination.role !== authPortal) {
      // Portal selection is never authorization. Keep the account on this
      // screen so the person sees why the requested portal was denied and can
      // deliberately continue to the database-authorized destination.
      setMismatch({ kind: 'role_mismatch', label: ROLE_PORTALS[destination.role].label, destination: destination.destination });
      return;
    }
    setMismatch(null);
    setScreen(destination.destination);
  }, [authPortal, identityError, identityStatus, portal, roleLoading, roles, setScreen, user]);

  const showMessage = (type, text) => { setMessageType(type); setMessage(text); };
  const switchMode = (nextMode) => {
    setMode(nextMode); setAuthMode(nextMode); setMessage(''); setMessageType(''); setConfirmPassword(''); setMismatch(null);
  };
  const chooseRole = () => { setMismatch(null); setAuthPortal(null); setAuthMode('signup'); setScreen('portalChoice'); };
  const openAuthorizedPortal = () => {
    const destination = authorizedPortal(roles);
    if (!destination) return;
    setMismatch(null);
    setScreen(destination.destination);
  };
  const leaveAccount = async () => {
    await signOut();
    setMismatch(null);
    setAuthPortal(null);
    setAuthMode('login');
    setScreen('landing');
  };
  const enterDemoPortal = (account) => {
    const destination = authorizedPortal([account.role]);
    if (!destination) throw new Error('Invalid demo account role.');
    setMessage('');
    setScreen(destination.destination);
  };
  const createFallbackAccount = async () => {
    const account = await createDemoAccount({ displayName, email, password, role: authPortal });
    enterDemoPortal(account);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (signup && !portal) return chooseRole();
    if (!email.trim() || !password) return showMessage('error', 'Email and password are required.');
    if (!EMAIL_PATTERN.test(email.trim())) return showMessage('error', 'Enter a valid email address.');
    if (signup) {
      if (!displayName.trim()) return showMessage('error', 'Please enter a display name.');
      if (password.length < PASSWORD_MIN_LENGTH) return showMessage('error', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      if (password !== confirmPassword) return showMessage('error', 'Passwords do not match.');
    }
    setBusy(true); setMismatch(null);
    showMessage('success', signup ? 'Creating your account…' : 'Signing you in…');
    try {
      if (!supabase) {
        if (signup) return void await createFallbackAccount();
        return void enterDemoPortal(await signInDemoAccount({ email, password }));
      }
      const result = signup
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim(), requested_portal: authPortal } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error || (signup && !result.data.session)) {
        if (signup) return void await createFallbackAccount();
        return void enterDemoPortal(await signInDemoAccount({ email, password }));
      }
      await refreshIdentity(result.data.session);
      showMessage('success', signup ? 'Setting up your Lumora account…' : 'Signed in. Checking your Lumora access…');
    } catch (error) {
      try {
        if (signup) return void await createFallbackAccount();
        return void enterDemoPortal(await signInDemoAccount({ email, password }));
      } catch (demoError) {
        showMessage('error', signup ? `Unable to create your demo account: ${demoError.message || String(demoError)}` : loginErrorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-orb auth-orb-left" /><div className="auth-orb auth-orb-right" />
      <section className="auth-card">
        <div className="landing-badge">✦ {portal ? `${portal.label} Portal` : 'Lumora Login'} ✦</div>
        <h1>{signup ? `Create ${portal.label} Account` : 'Welcome back'}</h1>
        <p>{signup ? 'Start a magical learning journey.' : 'Sign in and we’ll open your Lumora portal.'}</p>
        {mismatch ? (
          <div className="auth-mismatch" role="alert">
            <strong>{mismatch.kind === 'profile_missing' ? 'Your account is being set up.' : mismatch.kind === 'role_mismatch' ? `This account is registered as ${mismatch.label}.` : "This account doesn't have access to this portal."}</strong>
            <p>{mismatch.kind === 'profile_missing' ? 'Please try again in a moment.' : mismatch.kind === 'role_mismatch' ? `We’ll take you to the ${mismatch.label} portal.` : 'Please sign in again.'}</p>
            {mismatch.kind === 'role_mismatch' && <button className="pixel-btn-start" onClick={openAuthorizedPortal}>Continue to {mismatch.label} Portal</button>}
            {mismatch.kind === 'role_mismatch' && <button className="pixel-btn-secondary" onClick={leaveAccount}>Back to Login</button>}
            {mismatch.kind !== 'role_mismatch' && <button className="pixel-btn-secondary" onClick={leaveAccount}>Back to Login</button>}
          </div>
        ) : <form onSubmit={submit} noValidate>
          {signup && <label>Display name<input required type="text" autoComplete="name" placeholder="Explorer name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
          <label>Email<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input required minLength={PASSWORD_MIN_LENGTH} type="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {signup && <label>Confirm password<input required minLength={PASSWORD_MIN_LENGTH} type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>}
          <button className="pixel-btn-start" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : '▶ Login'}</button>
          {signup && <button type="button" className="pixel-btn-secondary" disabled={busy} onClick={() => { setAuthPortal(null); switchMode('login'); }}>I already have an account</button>}
          {!signup && <button type="button" className="pixel-btn-secondary" disabled={busy} onClick={chooseRole}>Create Account</button>}
          {signup && <button type="button" className="pixel-btn-secondary" onClick={chooseRole}>Choose Another Role</button>}
          <button type="button" className="retro-signout-btn" onClick={() => setScreen('landing')}>[ ← Back to Home ]</button>
          {roleLoading && user && <p className="auth-message">{identityStatus === 'profile_loading' ? 'Setting up your profile…' : 'Checking your Lumora access…'}</p>}
          {message && <p className={`auth-message ${messageType === 'error' ? 'auth-error' : ''}`} role="status">{message}</p>}
          {identityError && <p className="auth-message auth-error" role="alert">Unable to load your profile. Please try again.</p>}
        </form>}
      </section>
    </main>
  );
}
