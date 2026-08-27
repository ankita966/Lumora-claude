import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { t } from '../data/i18n';
import { useAuth } from '../auth/AuthProvider';
import { playClick, playChime } from '../lib/soundFx';

export default function TopBar({ worldColor, roundCount, currentRound, showBack = true }) {
  const {
    xp,
    screen,
    setScreen,
    goHome,
    setAuthPortal,
    language,
    soundFxEnabled,
    setSoundFxEnabled,
  } = useGameStore();

  const { configured, user, signOut } = useAuth();
  const isStudentWorld = [
    'soundForest',
    'visionValley',
    'storyCastle',
    'runeRealm',
    'memoryMountains',
  ].includes(screen);

  const handleBackClick = () => {
    playClick(0.5);
    if (isStudentWorld) setScreen('map');
    else goHome();
  };

  const handleAudioToggle = () => {
    playClick(0.4);
    if (!soundFxEnabled) playChime(1.2, 0.5);
    setSoundFxEnabled(!soundFxEnabled);
  };

  const leavePortal = async () => {
    playClick(0.5);
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
          <button
            className="map-btn tactile-nav-btn"
            onClick={handleBackClick}
            aria-label="Navigate Back"
          >
            {isStudentWorld ? `🗺 ${t(language, 'map')}` : `⌂ ${t(language, 'home')}`}
          </button>
        )}

        {roundCount ? (
          <div className="round-progress" style={{ '--world-color': worldColor }}>
            {Array.from({ length: roundCount }).map((_, i) => {
              const roundNum = i + 1;
              const cls =
                roundNum < currentRound
                  ? 'done'
                  : roundNum === currentRound
                  ? 'current'
                  : '';
              return (
                <div key={i} className={`round-dot ${cls}`}>
                  {roundNum < currentRound ? '✓' : roundNum}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="topbar-right">
        {/* Quick Audio Mute Toggle */}
        <button
          className={`audio-quick-toggle ${soundFxEnabled ? 'active' : 'muted'}`}
          onClick={handleAudioToggle}
          title={soundFxEnabled ? 'Mute sound FX' : 'Enable sound FX'}
          aria-label="Toggle Sound Effects"
        >
          {soundFxEnabled ? '🔊' : '🔇'}
        </button>

        {/* Animated XP Pill */}
        <div className="xp-pill tactile-xp">
          <span className="xp-star-icon">⭐</span>
          <span className="xp-counter-number">{xp.toLocaleString()} XP</span>
        </div>

        {configured && user && (
          <button className="map-btn signout-btn" onClick={leavePortal}>
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
