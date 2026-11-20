import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { t } from '../data/i18n';
import { useAuth } from '../auth/AuthProvider';

export default function WorldCompleteOverlay({ title, subtitle, bonusXp = 200, color, onRestart, results = [], continueLabel, artwork = null }) {
  const { setScreen, language } = useGameStore();
  const { displayName } = useAuth();
  return (
    <div className="complete-overlay">
      <div style={{ fontSize: 46 }}>🏆</div>
      <h2>{title}</h2>
      <p style={{ color, fontWeight: 800, margin: '-4px 0 4px' }}>Great job, {displayName}! ✨</p>
      <p>{subtitle}</p>
      {artwork && <div style={{ width: 180, height: 110, border: `1px solid ${color}`, borderRadius: 16, boxShadow: `0 0 24px ${color}`, background: 'rgba(79,216,255,.06)', overflow: 'hidden' }}>{artwork}</div>}
      <p className="bonus-xp">+{bonusXp} BONUS XP AWARDED! ⭐</p>
      {results.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
          {results.map((result) => (
            <div key={result.label} className="game-score-item" style={{ background: 'rgba(255,255,255,0.07)' }}>
              {result.label}: <span className="score-value">{result.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="cta-row">
        <button className="btn-pill btn-primary" onClick={() => setScreen('map')}>
          {continueLabel || t(language, 'backToMap')} →
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
