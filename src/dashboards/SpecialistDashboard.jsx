import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import LearningInsightsReport, { LearningInsightsEntryPoint } from './LearningInsightsReport';
import { useAuth } from '../auth/AuthProvider';
import { claimStudentLinkCode, loadLinkedStudents } from '../services/linkedStudents';

function formatDate(timestamp) {
  return timestamp ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(timestamp)) : '—';
}

export default function SpecialistDashboard() {
  const { displayName, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [linkCode, setLinkCode] = useState('');
  const [linkState, setLinkState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadLinkedStudents(user?.id || 'specialist-viewer', 'specialist')
      .then((linkedStudents) => {
        if (!active) return;
        setStudents(linkedStudents);
        setSelectedId((current) => linkedStudents.some((student) => student.id === current) ? current : linkedStudents[0]?.id ?? null);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [user, reloadVersion]);

  const selected = students.find((student) => student.id === selectedId) ?? null;

  const submitLinkCode = async (event) => {
    event.preventDefault();
    if (!linkCode.trim()) return;
    setLinkState({ status: 'loading', message: 'Verifying student link code…' });
    try {
      const linked = await claimStudentLinkCode(linkCode);
      setLinkCode('');
      setLinkState({ status: 'success', message: `${linked?.display_name || 'Student'} has been linked to your caseload.` });
      setReloadVersion((version) => version + 1);
    } catch (error) {
      setLinkState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to link this student.' });
    }
  };

  return (
    <div>
      <TopBar worldColor="var(--purple)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>🔬 {displayName}'s Specialist Lab</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A learning-support view across students — for practice patterns, not diagnosis.</p>
      </div>
      <LearningInsightsEntryPoint learner={selected || { displayName: 'Learner' }} />

      <section className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px' }} aria-labelledby="link-specialist-student-title">
        <h3 id="link-specialist-student-title" style={{ marginTop: 0 }}>Link a Student</h3>
        <p style={{ color: 'var(--text-mid)', fontSize: 13, margin: '0 0 12px' }}>
          Enter the student link code (e.g. <code>LUMORA-XXXXXX</code>) to connect their progress observations to your specialist view.
        </p>
        <form onSubmit={submitLinkCode} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <label style={{ display: 'grid', flex: '1 1 240px', gap: 6, color: 'var(--text-mid)', fontSize: 13 }}>
            Student link code
            <input
              value={linkCode}
              onChange={(event) => setLinkCode(event.target.value)}
              autoComplete="off"
              inputMode="text"
              maxLength={40}
              placeholder="e.g. LUMORA-XXXXXX"
              style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}
            />
          </label>
          <button
            type="submit"
            className="ref-action-btn-primary"
            disabled={linkState.status === 'loading' || !linkCode.trim()}
            style={{ alignSelf: 'end' }}
          >
            {linkState.status === 'loading' ? 'Linking…' : 'Link Student'}
          </button>
        </form>
        {linkState.message && (
          <p
            role={linkState.status === 'error' ? 'alert' : 'status'}
            className={linkState.status === 'error' ? 'auth-error' : ''}
            style={{ marginTop: 10, fontSize: 13, color: linkState.status === 'success' ? 'var(--cyan)' : undefined }}
          >
            {linkState.message}
          </p>
        )}
      </section>

      {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>Loading authorized student data…</div>}
      {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>Unable to load authorized student data. Please try again.</div>}
      {status === 'ready' && !students.length && (
        <div className="panel-card" style={{ maxWidth: 620, margin: '24px auto', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>No learners linked yet. Generate or enter a student linking code to connect a learner.</p>
        </div>
      )}

      {students.length > 0 && (
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          {students.map((student) => (
            <button key={student.id} className={`panel-card child-card ${selected?.id === student.id ? 'active' : ''}`} style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => setSelectedId(student.id)}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{student.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{Object.keys(student.worldsCompleted || {}).length}/5 worlds complete · {(student.activityLog || []).length} rounds</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          <div className="panel-card"><div className="dash-label">XP</div><div className="dash-stat">{(selected.xp || 0).toLocaleString()}</div></div>
          <div className="panel-card"><div className="dash-label">Sessions completed</div><div className="dash-stat">{selected.sessionsCompleted || 0}</div></div>
          <div className="panel-card"><div className="dash-label">Worlds completed</div><div className="dash-stat">{Object.keys(selected.worldsCompleted || {}).length}/5</div></div>
          <div className="panel-card"><div className="dash-label">Rounds recorded</div><div className="dash-stat">{(selected.activityLog || []).length}</div></div>
        </div>
      )}

      <LearningInsightsReport learner={selected} role="specialist" onRefresh={() => setReloadVersion((version) => version + 1)} />

      {selected && (
        <div className="dash-grid" style={{ marginTop: 18, marginBottom: 60 }}>
          <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Recent Activity History</h3>
            {selected.activityLog?.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ color: 'var(--text-low)', textAlign: 'left' }}><th style={{ padding: '6px 8px' }}>World</th><th style={{ padding: '6px 8px' }}>Round</th><th style={{ padding: '6px 8px' }}>Accuracy</th><th style={{ padding: '6px 8px' }}>When</th></tr></thead>
                <tbody>{selected.activityLog.slice(-20).reverse().map((attempt) => (
                  <tr key={`${attempt.ts}-${attempt.world}-${attempt.round}`} style={{ borderTop: '1px solid var(--border-glow)' }}>
                    <td style={{ padding: '8px' }}>{attempt.world}</td>
                    <td style={{ padding: '8px' }}>{attempt.round}</td>
                    <td style={{ padding: '8px' }}>{Math.round(attempt.accuracy * 100)}%</td>
                    <td style={{ padding: '8px' }}>{formatDate(attempt.ts)}</td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p style={{ color: 'var(--text-low)', fontSize: 13 }}>No recorded activity yet.</p>}
          </div>
        </div>
      )}
      <Mascot color="var(--purple)" icon="🦉" message={selected ? `Reviewing ${selected.displayName}'s practice patterns.` : `Welcome, ${displayName}!`} />
    </div>
  );
}
