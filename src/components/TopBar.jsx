import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { t } from '../data/i18n';
import { useAuth } from '../auth/AuthProvider';

export default function TopBar({ worldColor, roundCount, currentRound, showBack = true }) {
  const { xp, screen, setScreen, goHome, setAuthPortal, language } = useGameStore();
  const { configured, user, signOut } = useAuth();
  const isStudentWorld = ['soundForest', 'visionValley', 'storyCastle', 'runeRealm', 'memoryMountains'].includes(screen);
  const leavePortal = async () => {
    try {
      await signOut();
    } finally {
      setAuthPortal(null);
      goHome();
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="map-btn" onClick={() => (isStudentWorld ? setScreen('map') : goHome())}>
            {isStudentWorld ? `🗺 ${t(language, 'map')}` : `⌂ ${t(language, 'home')}`}
          </button>
        )}
        {roundCount ? (
          <div className="round-progress" style={{ '--world-color': worldColor }}>
            {Array.from({ length: roundCount }).map((_, i) => {
              const roundNum = i + 1;
              const cls = roundNum < currentRound ? 'done' : roundNum === currentRound ? 'current' : '';
              return (
                <div key={i} className={`round-dot ${cls}`}>
                  {roundNum < currentRound ? '✓' : roundNum}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="xp-pill">⭐ {xp.toLocaleString()} XP</div>
      {configured && user && <button className="map-btn" onClick={leavePortal}>Sign out</button>}
    </div>
  );
}
