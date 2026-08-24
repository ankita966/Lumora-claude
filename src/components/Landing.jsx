import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { AVATARS } from '../data/worlds';
import { t } from '../data/i18n';
import Mascot from './Mascot';

export default function Landing() {
  const { setScreen, setUserMode, userMode, language, handConnected } = useGameStore();

  return (
    <div className="landing">
      <div className="landing-badge">✦ {t(language, 'tagline')} ✦</div>
      <h1>{t(language, 'title')}</h1>
      <h2>{t(language, 'subtitle1')}</h2>
      <p className="sub">{t(language, 'subtitle2')}</p>

      <div className="avatar-rail">
        {AVATARS.map((a) => (
          <div className="avatar-chip" key={a.name}>
            <div className="avatar-circle" style={{ '--ring': a.ring }}>{a.icon}</div>
            <div className="name">{a.name}</div>
            <div className="role">{a.role}</div>
          </div>
        ))}
      </div>

      <div className="landing-quote">{t(language, 'quote')}</div>

      <div className="cta-row">
        <button className="btn-pill btn-primary" onClick={() => setScreen('map')}>
          {t(language, 'enterWorld')} →
        </button>
        <button className="btn-pill btn-secondary" onClick={() => setScreen('map')}>
          {t(language, 'exploreWorlds')} 🗺
        </button>
      </div>

      <div className="mode-row">
        {[
          ['child', t(language, 'childMode'), '🎮'],
          ['parent', t(language, 'parentPortal'), '👪'],
          ['teacher', t(language, 'teacherClass'), '🏫'],
          ['specialist', t(language, 'specialistLab'), '🔬'],
        ].map(([key, label, icon]) => (
          <button
            key={key}
            className={`mode-chip ${userMode === key ? 'active' : ''}`}
            onClick={() => setUserMode(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <Mascot
        color="var(--cyan)"
        icon="🤖"
        message={handConnected ? 'Hand detected! You are connected 👋' : 'Show your hand to the camera to connect! 👋'}
      />
    </div>
  );
}
