import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { t } from '../data/i18n';
import Mascot from './Mascot';
import TopBar from './TopBar';

const LAYOUT = {
  soundForest: { gridColumn: 1, gridRow: 1 },
  visionValley: { gridColumn: 2, gridRow: 1 },
  storyCastle: { gridColumn: 3, gridRow: 1 },
  runeRealm: { gridColumn: 1, gridRow: 2, marginLeft: '20%' },
  memoryMountains: { gridColumn: 3, gridRow: 2, marginRight: '20%' },
};

export default function WorldMap() {
  const { setScreen, language, worldsCompleted } = useGameStore();

  return (
    <div>
      <TopBar worldColor="var(--cyan)" showBack />
      <div className="world-map-title">{t(language, 'worldMapTitle')}</div>
      <div className="world-map-grid">
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
                  {worldsCompleted[key] && <span style={{ position: 'absolute', marginTop: -46, marginLeft: 38, fontSize: 18 }}>✓</span>}
                </div>
                <div className="w-name">{w.name}</div>
                <div className="w-desc">{w.focus}</div>
              </button>
            </div>
          );
        })}
      </div>
      <p className="world-map-hint">{t(language, 'selectWorldHint')}</p>
      <Mascot color="var(--purple)" icon="🤖" message="Pick a world, brave learner! ✨" />
    </div>
  );
}
