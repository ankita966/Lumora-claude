import React from 'react';
import { useGameStore } from '../store/useGameStore';

const PORTALS = [
  ['student', '🎓', 'Student', 'Play and grow through magical learning worlds.'],
  ['teacher', '👩‍🏫', 'Teacher', 'View your classroom learning space.'],
  ['parent', '👨‍👩‍👧', 'Parent', 'See your child’s practice progress.'],
  ['school_admin', '🏫', 'School Admin', 'Open your school learning space.'],
  ['specialist', '🧑‍⚕️', 'Specialist', 'Review your specialist lab.'],
];

export default function PortalChoiceScreen() {
  const { setScreen, setAuthMode, setAuthPortal } = useGameStore();
  const selectPortal = (role) => {
    setAuthPortal(role);
    setAuthMode('signup');
    setScreen('auth');
  };

  return (
    <main className="auth-screen">
      <div className="auth-orb auth-orb-left" /><div className="auth-orb auth-orb-right" />
      <section className="auth-card portal-choice-card">
        <div className="landing-badge">✦ Lumora Portal ✦</div>
        <h1>Choose your Lumora portal</h1>
        <p>Select the role for your new account. It will be saved to your Lumora profile.</p>
        <div className="portal-choice-list">
          {PORTALS.map(([role, icon, label, detail]) => (
            <button key={role} className="portal-choice" onClick={() => selectPortal(role)}>
              <span aria-hidden="true">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span><b aria-hidden="true">→</b>
            </button>
          ))}
        </div>
        <button type="button" className="retro-signout-btn" onClick={() => setScreen('landing')}>[ ← Back to Home ]</button>
      </section>
    </main>
  );
}
