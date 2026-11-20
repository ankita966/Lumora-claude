import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import LearningInsightsReport, { LearningInsightsEntryPoint } from './LearningInsightsReport';
import { useAuth } from '../auth/AuthProvider';
import { loadLinkedStudents } from '../services/linkedStudents';

function averageAccuracy(activityLog) {
  if (!activityLog.length) return null;
  return Math.round((activityLog.reduce((total, attempt) => total + attempt.accuracy, 0) / activityLog.length) * 100);
}

export default function TeacherDashboard() {
  const { displayName, user, configured } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return undefined;
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

  const overview = useMemo(() => {
    const activity = students.flatMap((student) => student.activityLog);
    return {
      activeLearners: students.filter((student) => student.activityLog.length).length,
      completedWorlds: students.reduce((total, student) => total + Object.keys(student.worldsCompleted).length, 0),
      averageAccuracy: averageAccuracy(activity),
    };
  }, [students]);

  return <div>
    <TopBar worldColor="var(--cyan)" showBack />
    <div style={{ textAlign: 'center', margin: '10px 0 26px' }}><h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>🏫 {displayName}'s Teacher Portal</h2><p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A focused view of the learners authorized for your class.</p></div>
    {!configured && <div className="panel-card" role="status" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Student assignments need a connected Supabase project. This offline demo cannot read or save assignments.</div>}
    <LearningInsightsEntryPoint learner={selected || { displayName: 'Learner' }} />
    {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Loading authorized learner progress…</div>}
    {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Unable to load learner progress. Please try again.</div>}
    {status === 'ready' && configured && !students.length && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>No students are assigned to this teacher account yet. Ask your school administrator to assign a student to your account.</div>}
    <div className="dash-grid" style={{ marginBottom: 22 }}>
      <div className="panel-card"><div className="dash-label">Students</div><div className="dash-stat">{students.length}</div></div>
      <div className="panel-card"><div className="dash-label">Active learners</div><div className="dash-stat">{overview.activeLearners}</div></div>
      <div className="panel-card"><div className="dash-label">Worlds completed</div><div className="dash-stat">{overview.completedWorlds}</div></div>
      <div className="panel-card"><div className="dash-label">Average accuracy</div><div className="dash-stat">{overview.averageAccuracy === null ? '—' : `${overview.averageAccuracy}%`}</div></div>
    </div>
    {students.length > 0 && <div className="panel-card" style={{ maxWidth: 1020, margin: '0 auto 24px', overflowX: 'auto' }}><h3 style={{ marginTop: 0 }}>Learner Progress</h3><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th>Name</th><th>Accuracy</th><th>Worlds</th><th>Rounds</th><th>Latest activity</th></tr></thead><tbody>{students.map((student) => {
      const latest = student.activityLog.at(-1);
      const accuracy = averageAccuracy(student.activityLog);
      return <tr key={student.id} aria-selected={student.id === selectedId} style={{ borderTop: '1px solid var(--border-glow)' }}><td style={{ padding: '10px 0', fontWeight: 700 }}><button type="button" onClick={() => setSelectedId(student.id)} aria-pressed={student.id === selectedId} style={{ color: 'inherit', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>{student.displayName}</button></td><td>{accuracy === null ? '—' : `${accuracy}%`}</td><td>{Object.keys(student.worldsCompleted).length}/5</td><td>{student.activityLog.length}</td><td>{latest ? `${latest.world} · Round ${latest.round}` : 'No activity yet'}</td></tr>;
    })}</tbody></table></div>}
    <LearningInsightsReport learner={selected} role="teacher" onRefresh={() => setReloadVersion((version) => version + 1)} />
    <Mascot color="var(--cyan)" icon="📚" message={students.length ? `Your class insights are ready, ${displayName}.` : `Welcome, ${displayName}!`} />
  </div>;
}
