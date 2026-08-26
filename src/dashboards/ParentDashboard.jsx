import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import SkillBars from './SkillBars';
import { computeProfile, recommendNextActivity, skillLabel } from '../adaptive/engine';
import { useAuth } from '../auth/AuthProvider';
import { loadLinkedStudents } from '../services/linkedStudents';

function formatTime(ms) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressSpark({ log }) {
  if (log.length < 2) {
    return <p style={{ color: 'var(--text-low)', fontSize: 12.5 }}>Play a few more rounds to see progress over time here.</p>;
  }
  const recent = log.slice(-20);
  const w = 560;
  const h = 90;
  const pts = recent.map((entry, i) => {
    const x = (i / (recent.length - 1)) * (w - 20) + 10;
    const y = h - 10 - entry.accuracy * (h - 20);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 90 }}>
      <polyline points={pts.join(' ')} fill="none" stroke="var(--cyan)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px var(--cyan))' }} />
      {recent.map((entry, i) => {
        const [x, y] = pts[i].split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r={3} fill="var(--cyan)" />;
      })}
    </svg>
  );
}

export default function ParentDashboard() {
  const { displayName, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    if (!user) return undefined;
    setStatus('loading');
    loadLinkedStudents(user.id, 'parent')
      .then((linkedStudents) => {
        if (!active) return;
        setStudents(linkedStudents);
        setSelectedId((current) => linkedStudents.some((student) => student.id === current) ? current : linkedStudents[0]?.id ?? null);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [user]);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const profile = useMemo(() => computeProfile(selected?.activityLog ?? []), [selected]);
  const recommendation = useMemo(() => recommendNextActivity(profile), [profile]);
  const scored = Object.entries(profile).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1]);
  const strengths = scored.slice(0, 2);
  const needsPractice = scored.slice(-2).reverse();

  return (
    <div>
      <TopBar worldColor="var(--cyan)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 30px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>👪 {selected ? `${selected.displayName}'s Progress` : `${displayName}'s Parent Portal`}</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A gentle look at how your child is practicing — not a diagnosis, just progress.</p>
      </div>

      {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Loading linked child progress…</div>}
      {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Unable to load linked child progress. Please try again.</div>}
      {status === 'ready' && !students.length && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>No child is linked to this parent account yet.</div>}
      {students.length > 1 && <div className="mode-row" style={{ marginBottom: 22 }}>{students.map((student) => <button key={student.id} className={`mode-chip ${student.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(student.id)}>{student.displayName}</button>)}</div>}

      <div className="dash-grid" style={{ marginBottom: 24 }}>
        <div className="panel-card">
          <div className="dash-label">Sessions completed</div>
          <div className="dash-stat">{selected?.sessionsCompleted ?? '—'}</div>
        </div>
        <div className="panel-card">
          <div className="dash-label">Time spent learning</div>
          <div className="dash-stat">{selected ? formatTime(selected.totalTimeMs) : '—'}</div>
        </div>
        <div className="panel-card">
          <div className="dash-label">Worlds completed</div>
          <div className="dash-stat">{selected ? `${Object.keys(selected.worldsCompleted).length}/5` : '—'}</div>
        </div>
        <div className="panel-card">
          <div className="dash-label">Total attempts logged</div>
          <div className="dash-stat">{selected?.activityLog.length ?? '—'}</div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Skill Progress</h3>
          <SkillBars profile={profile} />
          <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 10 }}>
            These percentages reflect practice performance only and are never a diagnosis of dyslexia, dysgraphia, or dyscalculia.
          </p>
        </div>

        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Strengths &amp; Areas to Practice</h3>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 800, marginBottom: 6 }}>💪 Strengths</div>
            {strengths.length ? strengths.map(([k, v]) => (
              <div key={k} style={{ fontSize: 13, color: 'var(--text-hi)' }}>{skillLabel(k)} — {v}%</div>
            )) : <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Play a round to unlock this.</div>}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#ffb45c', fontWeight: 800, marginBottom: 6 }}>🌱 Growing Areas</div>
            {needsPractice.length ? needsPractice.map(([k, v]) => (
              <div key={k} style={{ fontSize: 13, color: 'var(--text-hi)' }}>{skillLabel(k)} — {v}%</div>
            )) : <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Play a round to unlock this.</div>}
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: 18 }}>
        <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>🎯 Recommended Next Activity</h3>
          <p style={{ fontSize: 14, color: 'var(--text-hi)' }}>{selected ? recommendation.message : 'Link a child account to see a recommendation.'}</p>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: 18, marginBottom: 60 }}>
        <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>📈 Progress Over Time</h3>
          <ProgressSpark log={selected?.activityLog ?? []} />
        </div>
      </div>

      <Mascot color="var(--cyan)" icon="🤖" message={selected ? `${selected.displayName}'s learning journey is shining.` : `Welcome, ${displayName}!`} />
    </div>
  );
}
