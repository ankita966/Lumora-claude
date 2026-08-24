import React from 'react';
import { SKILLS, skillLabel } from '../adaptive/engine';
import { WORLDS } from '../data/worlds';

export default function SkillBars({ profile }) {
  return (
    <div>
      {Object.keys(SKILLS).map((key) => {
        const val = profile[key];
        const color = WORLDS[SKILLS[key].world]?.color ?? 'var(--cyan)';
        return (
          <div className="skill-bar-row" key={key}>
            <span style={{ width: 110, fontSize: 12.5, color: 'var(--text-mid)', flexShrink: 0 }}>{skillLabel(key)}</span>
            <div className="skill-bar-track">
              <div
                className="skill-bar-fill"
                style={{ width: val === null ? '0%' : `${val}%`, background: color, boxShadow: `0 0 8px ${color}` }}
              />
            </div>
            <span style={{ width: 56, textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: val === null ? 'var(--text-low)' : color }}>
              {val === null ? '—' : `${val}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
