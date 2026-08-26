import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { t } from '../data/i18n';
import Mascot from './Mascot';
import TopBar from './TopBar';
import { useAuth } from '../auth/AuthProvider';

const LAYOUT = {
  soundForest: { gridColumn: 1, gridRow: 1 },
  visionValley: { gridColumn: 2, gridRow: 1 },
  storyCastle: { gridColumn: 3, gridRow: 1 },
  runeRealm: { gridColumn: 1, gridRow: 2, marginLeft: '20%' },
  memoryMountains: { gridColumn: 3, gridRow: 2, marginRight: '20%' },
};

export default function WorldMap() {
  const { setScreen, language, worldsCompleted } = useGameStore();
  const { displayName } = useAuth();

  return (
    <div>
      <TopBar worldColor="var(--cyan)" showBack />
      <div className="world-map-title">{t(language, 'worldMapTitle')}</div>
      <div className="world-map-grid magical-world-map">
        <svg className="world-map-paths" viewBox="0 0 900 520" preserveAspectRatio="none" aria-hidden="true">
          <path d="M150 145 C270 85 330 85 450 145 S630 205 750 145 M150 145 C205 300 260 350 360 390 M750 145 C690 300 650 350 540 390" />
          <path className="world-map-path-glow" d="M150 145 C270 85 330 85 450 145 S630 205 750 145 M150 145 C205 300 260 350 360 390 M750 145 C690 300 650 350 540 390" />
        </svg>
        {WORLD_ORDER.map((key) => {
          const w = WORLDS[key];
          const style = { ...LAYOUT[key], '--nc': w.color };
          return (
            <div className="world-node-slot" key={key} style={{ gridColumn: style.gridColumn, gridRow: style.gridRow }}>
              <button
                className={`world-node ${w.center ? 'center' : ''}`}
                style={style}
                onClick={() => setScreen(key, key)}
              >
                <div className="world-ring">
                  {w.icon}
                  <span className="portal-spark" aria-hidden="true">✦</span>
                  {worldsCompleted[key] && <span style={{ position: 'absolute', marginTop: -46, marginLeft: 38, fontSize: 18 }}>✓</span>}
                </div>
                <div className="w-name">{w.name}</div>
                <div className="w-desc">{w.focus}</div>
                <div className="w-preview">5 magical rounds</div>
              </button>
            </div>
          );
        })}
      </div>
      <p className="world-map-hint">{t(language, 'selectWorldHint')}</p>
      <Mascot color="var(--purple)" icon="🤖" message={`Hey ${displayName}! Pick a world for your next adventure ✨`} />
    </div>
  );
}
