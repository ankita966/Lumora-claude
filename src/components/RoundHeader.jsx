import React from 'react';
import AsciiScenery from './AsciiScenery';

// Which ASCII diorama flanks each world's rounds.
// Keys are lowercase world names found in titles (e.g. "MEMORY MOUNTAINS").
const SCENERY_MAP = {
  memory: { left: 'mountains', right: 'mountains', seedR: 7 },
  sound: { left: 'forest', right: 'forest', seedR: 13 },
  story: { left: 'castle', right: 'castle', seedR: 29 },
  vision: { left: 'mountains', right: 'forest', seedR: 41 },
  rune: { left: 'castle', right: 'mountains', seedR: 57 },
};

function pickScenery(title = '') {
  const t = title.toLowerCase();
  for (const key of Object.keys(SCENERY_MAP)) {
    if (t.includes(key)) return SCENERY_MAP[key];
  }
  return SCENERY_MAP.memory;
}

export default function RoundHeader({ title, subtitle, progress, color }) {
  const scenery = pickScenery(title);
  return (
    <>
      <AsciiScenery variant={scenery.left} side="left" seed={3} />
      <AsciiScenery variant={scenery.right} side="right" seed={scenery.seedR} />
      <div className="round-header" style={{ '--world-color': color }}>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {typeof progress === 'number' && (
          <div className="progress-track" style={{ marginTop: 14 }}>
            <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%`, '--world-color': color }} />
          </div>
        )}
      </div>
    </>
  );
}
