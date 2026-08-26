import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { AVATARS } from '../data/worlds';
import { t } from '../data/i18n';
import Mascot from './Mascot';
import HandCursorLayer from './HandCursorLayer';
import { useCursor } from '../hooks/useCursor';
import { useAuth } from '../auth/AuthProvider';
import { authorizedPortal } from '../auth/roleRouting';

export default function Landing() {
  const { setScreen, setAuthMode, setAuthPortal, setUserMode, userMode, language, handConnected, xp, worldsCompleted, sessionsCompleted } = useGameStore();
  const { configured, user, roles, displayName, signOut } = useAuth();
  const landingRef = useRef(null);
  const transitionRef = useRef(null);
  const cursor = useCursor(landingRef, true);
  const [entering, setEntering] = useState(false);
  const worldProgress = Object.keys(worldsCompleted).length;
  const level = Math.max(1, Math.floor(xp / 4000) + 1);

  useEffect(() => () => window.clearTimeout(transitionRef.current), []);

  const enterWorld = useCallback(() => {
    if (entering) return;
    setEntering(true);
    const destination = configured && user ? authorizedPortal(roles)?.destination : null;
    transitionRef.current = window.setTimeout(() => setScreen(user ? destination || 'landing' : 'auth'), 280);
  }, [configured, entering, roles, setScreen, user]);
  const login = () => {
    setAuthPortal(null);
    setAuthMode('login');
    setScreen('auth');
  };
  const createAccount = () => {
    setAuthPortal(null);
    setAuthMode('signup');
    setScreen('portalChoice');
  };

  return (
    <div className={`landing ${entering ? 'landing-entering' : ''}`} ref={landingRef}>
      <HandCursorLayer
        videoRef={cursor.videoRef}
        pixel={cursor.pixel}
        cameraStatus={cursor.cameraStatus}
        handDetected={cursor.handDetected}
        pinching={cursor.pinching}
        interacting={cursor.pinching}
        color="#4fd8ff"
        showMirror
        showCursor
      />
      <div className="landing-badge">✦ {t(language, 'tagline')} ✦</div>
      <h1>{t(language, 'title')}</h1>
      <h2>{user ? `Welcome back, ${displayName}! ✨` : t(language, 'subtitle1')}</h2>
      <p className="sub">{t(language, 'subtitle2')}</p>

      <div className="children-hero">
        <img src="/children-hero.jpg" alt="Children creating colorful art together" />
        <div className="children-hero-glow" aria-hidden="true" />
        <div className="children-hero-caption">✨ Every child’s magic shines differently</div>
      </div>

      <div className="avatar-rail">
        {AVATARS.map((a) => (
          <div className="avatar-chip" key={a.name}>
            <div className="avatar-circle" style={{ '--ring': a.ring }}>{a.icon}</div>
            <div className="name">{a.name}</div>
            <div className="role">{a.role}</div>
          </div>
        ))}
      </div>

      <div className="landing-hud" aria-label="Lumora game progress">
        <span>⭐ {xp.toLocaleString()} XP</span><span>🔥 {Math.min(9, sessionsCompleted)} COMBO</span><span>🏆 LEVEL {level}</span><span>🌌 {worldProgress}/5 WORLDS</span>
      </div>

      <div className="landing-quote">{t(language, 'quote')}</div>

      <div className="cta-row">
        {!user ? <>
          <button className="btn-pill btn-primary landing-portal-button" onClick={login}>Login →</button>
          <button className="btn-pill btn-secondary" onClick={createAccount}>Create Account</button>
        </> : <>
          <button className="btn-pill btn-primary landing-portal-button" onClick={enterWorld}>{t(language, 'enterWorld')} →</button>
          <button className="btn-pill btn-secondary" onClick={enterWorld}>{t(language, 'exploreWorlds')} 🗺</button>
        </>}
      </div>

      <div className="mode-row">
        {[
          ['child', 'student', t(language, 'childMode'), '🎮'],
          ['parent', 'parent', t(language, 'parentPortal'), '👪'],
          ['teacher', 'teacher', t(language, 'teacherClass'), '🏫'],
          ['school_admin', 'school_admin', 'School Admin Portal', '🏛️'],
          ['specialist', 'specialist', t(language, 'specialistLab'), '🔬'],
        ].filter(([, role]) => user && roles.includes(role)).map(([key, , label, icon]) => (
          <button
            key={key}
            className={`mode-chip ${userMode === key ? 'active' : ''}`}
            onClick={() => setUserMode(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      {user && <button className="btn-pill btn-ghost" style={{ marginTop: 14 }} onClick={signOut}>Sign out</button>}

      <Mascot
        color="var(--cyan)"
        icon="🤖"
        message={handConnected ? `Hey ${displayName}! You are connected 👋` : user ? `Hey ${displayName}! Ready for some magic? ✨` : 'Show your hand to the camera to connect! 👋'}
      />
    </div>
  );
}
