import React from 'react';
import { useAuth } from './AuthProvider';
import { SCREEN_ROLES } from './roleRouting';
import { authorizedPortal } from './roleRouting';
import { useGameStore } from '../store/useGameStore';

export { SCREEN_ROLES } from './roleRouting';

export function RoleGate({ screen, children }) {
  const { configured, loading, roleLoading, user, roles, identityStatus, error, signOut } = useAuth();
  const setScreen = useGameStore((state) => state.setScreen);
  const permitted = SCREEN_ROLES[screen];
  const destination = identityStatus === 'ready' ? authorizedPortal(roles) : null;
  // Privileged accounts can retain the baseline student row. Screen access
  // follows the resolved portal role, not any secondary role row.
  const hasScreenAccess = Boolean(destination && permitted?.includes(destination.role));

  if (!configured || !permitted) return children;
  if (loading || (user && roleLoading)) return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 480, textAlign: 'center' }}><h2>Opening your portal…</h2><p>{identityStatus === 'profile_loading' ? 'Setting up your profile.' : 'Checking your Lumora access.'}</p></div>;
  if (!user) return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 480, textAlign: 'center' }}><h2>Login required</h2><p>Return home and choose Login / Enter Portal to continue.</p></div>;
  if (error) return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 520, textAlign: 'center' }}><h2>Unable to load your account</h2><p>Please try again. If the problem continues, contact Lumora support.</p></div>;
  if (identityStatus === 'profile_missing') return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 520, textAlign: 'center' }}><h2>Your account is being set up</h2><p>We’re finishing your Lumora profile. Please refresh and try again in a moment.</p></div>;
  if (identityStatus === 'role_missing') return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 520, textAlign: 'center' }}><h2>Portal access unavailable</h2><p>Your account is not authorized for this portal. Please contact Lumora support if you believe this is a mistake.</p></div>;
  if (hasScreenAccess) return children;
  if (destination) return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 480, textAlign: 'center' }}><h2>This account is registered as {destination.label}.</h2><p>Only your registered Lumora portal is available to this account.</p><button className="btn-pill btn-primary" onClick={() => setScreen(destination.destination)}>Continue to {destination.label} Portal</button><button className="btn-pill btn-secondary" onClick={async () => { await signOut(); setScreen('landing'); }}>Back to Login</button></div>;
  return <div className="panel-card" style={{ margin: '100px auto', maxWidth: 480, textAlign: 'center' }}><h2>Portal access required</h2><p>You do not have access to this portal with your current role.</p></div>;
}
