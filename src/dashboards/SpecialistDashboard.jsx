import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import SkillBars from './SkillBars';
import { computeProfile, recommendNextActivity, skillLabel } from '../adaptive/engine';
import { useAuth } from '../auth/AuthProvider';
import { loadLinkedStudents } from '../services/linkedStudents';

function formatDate(timestamp) {
  return timestamp ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(timestamp)) : '—';
}

export default function SpecialistDashboard() {
  const { displayName, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    if (!user) return undefined;
    setStatus('loading');
    loadLinkedStudents(user.id, 'specialist')
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
  const needsPractice = Object.entries(profile).filter(([, score]) => score !== null).sort((a, b) => a[1] - b[1]).slice(0, 2);

  return (
    <div>
      <TopBar worldColor="var(--purple)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>🔬 {displayName}'s Specialist Lab</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A learning-support view across students — for practice patterns, not diagnosis.</p>
      </div>

      {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>Loading authorized student data…</div>}
      {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>Unable to load authorized student data. Please try again.</div>}
      {status === 'ready' && !students.length && <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>No students are assigned to this specialist account yet.</div>}

      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {students.map((student) => (
          <button key={student.id} className={`panel-card child-card ${selected?.id === student.id ? 'active' : ''}`} style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => setSelectedId(student.id)}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{student.displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{Object.keys(student.worldsCompleted).length}/5 worlds complete · {student.activityLog.length} rounds</div>
          </button>
        ))}
      </div>

      {selected && <>
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          <div className="panel-card"><div className="dash-label">XP</div><div className="dash-stat">{selected.xp.toLocaleString()}</div></div>
          <div className="panel-card"><div className="dash-label">Sessions completed</div><div className="dash-stat">{selected.sessionsCompleted}</div></div>
          <div className="panel-card"><div className="dash-label">Worlds completed</div><div className="dash-stat">{Object.keys(selected.worldsCompleted).length}/5</div></div>
          <div className="panel-card"><div className="dash-label">Rounds recorded</div><div className="dash-stat">{selected.activityLog.length}</div></div>
        </div>
        <div className="dash-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="panel-card"><h3 style={{ marginTop: 0, fontSize: 15 }}>{selected.displayName} — Skill Progress</h3><SkillBars profile={profile} /></div>
          <div className="panel-card"><h3 style={{ marginTop: 0, fontSize: 15 }}>Areas Needing Practice</h3>{needsPractice.length ? needsPractice.map(([skill, score]) => <div key={skill} style={{ fontSize: 13, marginBottom: 6 }}>{skillLabel(skill)} — {score}%</div>) : <p style={{ fontSize: 13, color: 'var(--text-low)' }}>No completed rounds yet.</p>}<h3 style={{ fontSize: 14, marginTop: 16 }}>🎯 Recommended Activity</h3><p style={{ fontSize: 13 }}>{recommendation.message}</p></div>
        </div>
        <div className="dash-grid" style={{ marginTop: 18, marginBottom: 60 }}>
          <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Recent Activity History</h3>
            {selected.activityLog.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ color: 'var(--text-low)', textAlign: 'left' }}><th style={{ padding: '6px 8px' }}>World</th><th style={{ padding: '6px 8px' }}>Round</th><th style={{ padding: '6px 8px' }}>Accuracy</th><th style={{ padding: '6px 8px' }}>When</th></tr></thead><tbody>{selected.activityLog.slice(-20).reverse().map((attempt) => <tr key={`${attempt.ts}-${attempt.world}-${attempt.round}`} style={{ borderTop: '1px solid var(--border-glow)' }}><td style={{ padding: '8px' }}>{attempt.world}</td><td style={{ padding: '8px' }}>{attempt.round}</td><td style={{ padding: '8px' }}>{Math.round(attempt.accuracy * 100)}%</td><td style={{ padding: '8px' }}>{formatDate(attempt.ts)}</td></tr>)}</tbody></table> : <p style={{ color: 'var(--text-low)', fontSize: 13 }}>No recorded activity yet.</p>}
          </div>
        </div>
      </>}
      <Mascot color="var(--purple)" icon="🦉" message={selected ? `Reviewing ${selected.displayName}'s practice patterns.` : `Welcome, ${displayName}!`} />
    </div>
  );
}
