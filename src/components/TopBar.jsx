import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { t } from '../data/i18n';

export default function TopBar({ worldColor, roundCount, currentRound, showBack = true }) {
  const { xp, screen, setScreen, language } = useGameStore();

  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="map-btn" onClick={() => setScreen(screen === 'map' ? 'landing' : 'map')}>
            {screen === 'map' ? `⌂ ${t(language, 'home')}` : `🗺 ${t(language, 'map')}`}
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
    </div>
  );
}
