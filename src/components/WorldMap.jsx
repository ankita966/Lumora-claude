import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { t } from '../data/i18n';
import Mascot from './Mascot';
import TopBar from './TopBar';
import { useAuth } from '../auth/AuthProvider';
import { playClick, playChime } from '../lib/soundFx';

export default function WorldMap() {
  const { setScreen, language, worldsCompleted } = useGameStore();
  const { displayName } = useAuth();

  const handleWorldClick = (key) => {
    playClick(0.6);
    playChime(1.2, 0.5);
    setScreen(key, key);
  };

  const completedCount = Object.keys(worldsCompleted).filter((k) => worldsCompleted[k]).length;

  return (
    <div className="world-map-screen">
      <TopBar worldColor="var(--cyan)" showBack />

      {/* Hero Header */}
      <div className="cosmic-map-header">
        <div className="retro-map-badge">
          <span>REALM SECTOR: 5 WORLDS</span>
        </div>
        <h1 className="retro-pixel-map-title">{t(language, 'worldMapTitle')}</h1>
        <p className="cosmic-map-subtitle">
          {completedCount === 5
            ? '🏆 All 5 magical realms mastered! Select any realm to replay.'
            : `${completedCount}/5 Realms Mastered · Move wand or tap to enter.`}
        </p>
      </div>

      {/* Retro Constellation Stage */}
      <div className="cosmic-constellation-stage">
        {/* Animated Constellation Starlight Paths */}
        <svg
          className="constellation-svg-lines"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          aria-hidden="true"
          shapeRendering="crispEdges"
        >
          <defs>
            <linearGradient id="pathRetroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38B6FF" />
              <stop offset="25%" stopColor="#48B8D0" />
              <stop offset="50%" stopColor="#E5A83B" />
              <stop offset="75%" stopColor="#FF2E93" />
              <stop offset="100%" stopColor="#A47BE0" />
            </linearGradient>
          </defs>

          {/* Background guide lines */}
          <path
            d="M 180 160 Q 340 90 500 100 T 820 160 M 180 160 Q 240 320 320 430 Q 500 500 680 430 Q 760 320 820 160 M 500 100 Q 500 280 320 430 M 500 100 Q 500 280 680 430"
            fill="none"
            stroke="rgba(226, 232, 240, 0.15)"
            strokeWidth="3"
            strokeDasharray="8 8"
          />

          {/* Glowing Constellation Laser Beam */}
          <path
            className="laser-beam-anim"
            d="M 180 160 Q 340 90 500 100 T 820 160 M 180 160 Q 240 320 320 430 Q 500 500 680 430 Q 760 320 820 160"
            fill="none"
            stroke="url(#pathRetroGrad)"
            strokeWidth="3"
          />
        </svg>

        {/* Floating Celestial World Nodes */}
        <div className="cosmic-nodes-grid">
          {WORLD_ORDER.map((key) => {
            const w = WORLDS[key];
            const isCompleted = Boolean(worldsCompleted[key]);
            const isCenter = Boolean(w.center);

            return (
              <div
                key={key}
                className={`cosmic-node-wrap ${key}`}
                style={{ '--realm-color': w.color }}
              >
                <button
                  className={`retro-node-button ${isCenter ? 'center-orb' : ''} ${
                    isCompleted ? 'mastered' : ''
                  }`}
                  onClick={() => handleWorldClick(key)}
                  onMouseEnter={() => playClick(0.15)}
                  aria-label={`${w.name} - ${w.focus}`}
                >
                  {/* Core 8-Bit Pixel Sphere */}
                  <div className="retro-core-sphere">
                    <span className="orb-emoji-glyph">{w.icon}</span>
                  </div>

                  {/* Mastery Badge */}
                  {isCompleted && (
                    <div className="retro-mastery-crown" title="Realm Mastered!">
                      <span>★</span>
                    </div>
                  )}

                  {/* Content Info Box */}
                  <div className="retro-node-info-box">
                    <div className="retro-node-name">{w.name}</div>
                    <div className="retro-node-focus">{w.focus}</div>
                    <div className="retro-rounds-tag">
                      {isCompleted ? '✓ MASTERED' : '5 ROUNDS'}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="cosmic-map-footer-hint">{t(language, 'selectWorldHint')}</p>

      {/* Living Mascot Companion */}
      <Mascot
        color="var(--amber)"
        message={`Hey ${displayName}! Choose any realm to start your quest`}
      />
    </div>
  );
}
