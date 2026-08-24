import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { t } from '../data/i18n';

export default function WorldCompleteOverlay({ title, subtitle, bonusXp = 200, color, onRestart }) {
  const { setScreen, language } = useGameStore();
  return (
    <div className="complete-overlay">
      <div style={{ fontSize: 46 }}>🏆</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <p className="bonus-xp">+{bonusXp} BONUS XP AWARDED! ⭐</p>
      <div className="cta-row">
        <button className="btn-pill btn-primary" onClick={() => setScreen('map')}>
          {t(language, 'backToMap')} →
        </button>
        {onRestart && (
          <button className="btn-pill btn-ghost" onClick={onRestart} style={{ borderColor: color }}>
            ↻ {t(language, 'restart')}
          </button>
        )}
      </div>
    </div>
  );
}
