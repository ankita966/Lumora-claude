import React, { useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import SkillBars from './SkillBars';
import { buildDemoProfile, recommendNextActivity, skillLabel } from '../adaptive/engine';

const DEMO_CHILDREN = [
  { id: 1, name: 'Demo Child A', age: 7, seed: 11 },
  { id: 2, name: 'Demo Child B', age: 9, seed: 42 },
  { id: 3, name: 'Demo Child C', age: 6, seed: 73 },
  { id: 4, name: 'Demo Child D', age: 10, seed: 91 },
];

function demoActivityHistory(seed) {
  const rand = mulberry32(seed + 500);
  const worlds = ['Sound Forest', 'Vision Valley', 'Story Castle', 'Rune Realm', 'Memory Mountains'];
  return Array.from({ length: 6 }, (_, i) => ({
    world: worlds[Math.floor(rand() * worlds.length)],
    round: Math.ceil(rand() * 5),
    accuracy: Math.round(40 + rand() * 55),
    daysAgo: Math.floor(rand() * 12) + 1,
  })).sort((a, b) => a.daysAgo - b.daysAgo);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SpecialistDashboard() {
  const [selected, setSelected] = useState(DEMO_CHILDREN[0]);
  const profile = useMemo(() => buildDemoProfile(selected.seed), [selected]);
  const recommendation = useMemo(() => recommendNextActivity(profile), [profile]);
  const history = useMemo(() => demoActivityHistory(selected.seed), [selected]);
  const needsPractice = Object.entries(profile).sort((a, b) => a[1] - b[1]).slice(0, 2);

  return (
    <div>
      <TopBar worldColor="var(--purple)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>🔬 Specialist / Educator Lab</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A learning-support view across children — for practice patterns, not diagnosis.</p>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span className="demo-badge">⚠ ALL PROFILES BELOW ARE DEMO DATA</span>
      </div>

      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {DEMO_CHILDREN.map((c) => (
          <button
            key={c.id}
            className={`panel-card child-card ${selected.id === c.id ? 'active' : ''}`}
            style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
            onClick={() => setSelected(c)}
          >
            <div className="demo-badge">DEMO DATA</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Age {c.age} · Synthetic profile</div>
          </button>
        ))}
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div className="panel-card">
          <div className="demo-badge">DEMO DATA</div>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>{selected.name} — Skill Progress</h3>
          <SkillBars profile={profile} />
        </div>
        <div className="panel-card">
          <div className="demo-badge">DEMO DATA</div>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Areas Needing Practice</h3>
          {needsPractice.map(([k, v]) => (
            <div key={k} style={{ fontSize: 13, marginBottom: 6 }}>{skillLabel(k)} — {v}%</div>
          ))}
          <h3 style={{ fontSize: 14, marginTop: 16 }}>🎯 Recommended Activity</h3>
          <p style={{ fontSize: 13 }}>{recommendation.message}</p>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: 18, marginBottom: 60 }}>
        <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
          <div className="demo-badge">DEMO DATA</div>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Recent Activity History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--text-low)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>World</th>
                <th style={{ padding: '6px 8px' }}>Round</th>
                <th style={{ padding: '6px 8px' }}>Accuracy</th>
                <th style={{ padding: '6px 8px' }}>When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-glow)' }}>
                  <td style={{ padding: '8px' }}>{h.world}</td>
                  <td style={{ padding: '8px' }}>{h.round}</td>
                  <td style={{ padding: '8px' }}>{h.accuracy}%</td>
                  <td style={{ padding: '8px' }}>{h.daysAgo}d ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Mascot color="var(--purple)" icon="🦉" message="Select a demo profile to review practice patterns." />
    </div>
  );
}
