import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import LearningInsightsReport, { LearningInsightsEntryPoint } from './LearningInsightsReport';
import { useAuth } from '../auth/AuthProvider';
import { claimStudentLinkCode, loadLinkedStudents } from '../services/linkedStudents';

function averageAccuracy(activityLog) {
  if (!activityLog || !activityLog.length) return null;
  return Math.round((activityLog.reduce((total, attempt) => total + attempt.accuracy, 0) / activityLog.length) * 100);
}

export default function TeacherDashboard() {
  const { displayName, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [linkCode, setLinkCode] = useState('');
  const [linkState, setLinkState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let active = true;
    if (!user) {
      setStatus('ready');
      return undefined;
    }
    setStatus('loading');
    loadLinkedStudents(user.id, 'teacher')
      .then((authorizedStudents) => {
        if (!active) return;
        setStudents(authorizedStudents);
        setSelectedId((current) => authorizedStudents.some((student) => student.id === current) ? current : authorizedStudents[0]?.id ?? null);
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
      setLinkState({ status: 'success', message: `${linked?.display_name || 'Student'} has been linked to your class roster.` });
      setReloadVersion((version) => version + 1);
    } catch (error) {
      setLinkState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to link this student.' });
    }
  };

  const overview = useMemo(() => {
    const activity = students.flatMap((student) => student.activityLog || []);
    return {
      activeLearners: students.filter((student) => (student.activityLog || []).length).length,
      completedWorlds: students.reduce((total, student) => total + Object.keys(student.worldsCompleted || {}).length, 0),
      averageAccuracy: averageAccuracy(activity),
    };
  }, [students]);

  return (
    <div>
      <TopBar worldColor="var(--cyan)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 26px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>🏫 {displayName}'s Teacher Portal</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A focused view of the learners authorized for your class.</p>
      </div>
      <LearningInsightsEntryPoint learner={selected} />

      <section className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px' }} aria-labelledby="link-student-title">
        <h3 id="link-student-title" style={{ marginTop: 0 }}>Link a Student</h3>
        <p style={{ color: 'var(--text-mid)', fontSize: 13, margin: '0 0 12px' }}>
          Enter the link code generated from the student’s portal (e.g. <code>LUMORA-XXXXXX</code>) to connect their profile and practice insights to your class roster.
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

      {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Loading authorized learner progress…</div>}
      {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Unable to load learner progress. Please try again.</div>}
      {status === 'ready' && !students.length && (
        <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>No learners linked yet. Generate or enter a student linking code to connect a learner.</p>
        </div>
      )}

      {students.length > 0 && (
        <>
          <div className="dash-grid" style={{ marginBottom: 22 }}>
            <div className="panel-card"><div className="dash-label">Students</div><div className="dash-stat">{students.length}</div></div>
            <div className="panel-card"><div className="dash-label">Active learners</div><div className="dash-stat">{overview.activeLearners}</div></div>
            <div className="panel-card"><div className="dash-label">Worlds completed</div><div className="dash-stat">{overview.completedWorlds}</div></div>
            <div className="panel-card"><div className="dash-label">Average accuracy</div><div className="dash-stat">{overview.averageAccuracy === null ? '—' : `${overview.averageAccuracy}%`}</div></div>
          </div>
          <div className="panel-card" style={{ maxWidth: 1020, margin: '0 auto 24px', overflowX: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Class Roster</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr><th>Name</th><th>Accuracy</th><th>Worlds</th><th>Rounds</th><th>Latest activity</th></tr></thead>
              <tbody>{students.map((student) => {
                const latest = student.activityLog?.at(-1);
                const accuracy = averageAccuracy(student.activityLog || []);
                return (
                  <tr key={student.id} aria-selected={student.id === selectedId} style={{ borderTop: '1px solid var(--border-glow)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 700 }}>
                      <button type="button" onClick={() => setSelectedId(student.id)} aria-pressed={student.id === selectedId} style={{ color: 'inherit', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textDecoration: student.id === selectedId ? 'underline' : 'none' }}>
                        {student.displayName}
                      </button>
                    </td>
                    <td>{accuracy === null ? '—' : `${accuracy}%`}</td>
                    <td>{Object.keys(student.worldsCompleted || {}).length}/5</td>
                    <td>{student.activityLog?.length || 0}</td>
                    <td>{latest ? `${latest.world} · Round ${latest.round}` : 'No activity yet'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </>
      )}

      <LearningInsightsReport learner={selected} role="teacher" onRefresh={() => setReloadVersion((version) => version + 1)} />
      <Mascot color="var(--cyan)" icon="📚" message={students.length ? `Your class insights are ready, ${displayName}.` : `Welcome, ${displayName}!`} />
    </div>
  );
}
