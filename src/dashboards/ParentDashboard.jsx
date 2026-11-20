import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import LearningInsightsReport, { LearningInsightsEntryPoint } from './LearningInsightsReport';
import { useAuth } from '../auth/AuthProvider';
import { claimStudentLinkCode, loadLinkedStudents } from '../services/linkedStudents';

function formatTime(ms) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ParentDashboard() {
  const { displayName, user, configured } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [linkCode, setLinkCode] = useState('');
  const [linkState, setLinkState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadLinkedStudents(user?.id || 'parent-viewer', 'parent')
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
    setLinkState({ status: 'loading', message: 'Checking family link code…' });
    try {
      const linked = await claimStudentLinkCode(linkCode);
      setLinkCode('');
      setLinkState({ status: 'success', message: `${linked?.display_name || 'Learner'} is now linked to your parent account.` });
      setReloadVersion((version) => version + 1);
    } catch (error) {
      setLinkState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to link this learner.' });
    }
  };

  return (
    <div>
      <TopBar worldColor="var(--cyan)" showBack />
      <div style={{ textAlign: 'center', margin: '10px 0 30px' }}>
        <h2 style={{ color: 'var(--text-hi)', fontWeight: 800 }}>👪 {selected ? `${selected.displayName}'s Progress` : `${displayName}'s Parent Portal`}</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 13 }}>A gentle look at how your child is practicing — not a diagnosis, just progress.</p>
      </div>
      <LearningInsightsEntryPoint learner={selected || { displayName: 'Learner' }} />

      {status === 'loading' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Loading linked child progress…</div>}
      {status === 'error' && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>Unable to load linked child progress. Please try again.</div>}
      {status === 'ready' && !students.length && <div className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px', textAlign: 'center' }}>No child is linked to this parent account yet. Ask the learner to create a family link code on their Student Portal, then enter it below.</div>}
      {students.length > 1 && <div className="mode-row" style={{ marginBottom: 22 }}>{students.map((student) => <button key={student.id} className={`mode-chip ${student.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(student.id)}>{student.displayName}</button>)}</div>}

      <section className="panel-card" style={{ maxWidth: 620, margin: '0 auto 24px' }} aria-labelledby="link-child-title">
        <h3 id="link-child-title" style={{ marginTop: 0 }}>Link a child</h3>
        <p>On the child’s signed-in Student Portal, create a family link code and enter it here. The code expires after 30 minutes and links the child’s existing profile and progress.</p>
        <form onSubmit={submitLinkCode} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <label style={{ display: 'grid', flex: '1 1 240px', gap: 6, color: 'var(--text-mid)' }}>Family link code
            <input value={linkCode} onChange={(event) => setLinkCode(event.target.value)} autoComplete="off" inputMode="text" maxLength={40} placeholder="Enter the code from the Student Portal" />
          </label>
          <button type="submit" className="ref-action-btn-primary" disabled={linkState.status === 'loading' || !linkCode.trim()} style={{ alignSelf: 'end' }}>{linkState.status === 'loading' ? 'Linking…' : 'Link child'}</button>
        </form>
        {linkState.message && <p role={linkState.status === 'error' ? 'alert' : 'status'} className={linkState.status === 'error' ? 'auth-error' : ''}>{linkState.message}</p>}
      </section>

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

      <LearningInsightsReport learner={selected} role="parent" onRefresh={() => setReloadVersion((version) => version + 1)} />

      <Mascot color="var(--cyan)" icon="🤖" message={selected ? `${selected.displayName}'s learning journey is shining.` : `Welcome, ${displayName}!`} />
    </div>
  );
}
