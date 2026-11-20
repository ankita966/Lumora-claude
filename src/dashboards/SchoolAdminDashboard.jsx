import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { assignStudentAccess, loadAdminSchools, loadRegisteredUsers, provisionUser } from '../services/admin';
import LearningInsightsReport, { LearningInsightsEntryPoint } from './LearningInsightsReport';

const INVITABLE_ROLES = [
  ['teacher', 'Teacher'],
  ['parent', 'Parent'],
  ['specialist', 'Specialist'],
  ['school_admin', 'School Admin'],
];
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

export default function SchoolAdminDashboard() {
  const { displayName } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [status, setStatus] = useState('loading');
  const [invite, setInvite] = useState({ displayName: '', email: '', role: 'teacher', schoolId: '' });
  const [inviteState, setInviteState] = useState({ status: 'idle', message: '' });
  const [assignment, setAssignment] = useState({ studentId: '', role: 'teacher', granteeId: '' });
  const [assignmentState, setAssignmentState] = useState({ status: 'idle', message: '' });
  const [inspectStudentId, setInspectStudentId] = useState('');
  const overview = useMemo(() => ({
    students: users.filter((user) => user.roles?.includes('student')).length,
    teachers: users.filter((user) => user.roles?.includes('teacher')).length,
    activeAccounts: users.filter((user) => user.account_status === 'active').length,
  }), [users]);

  const refreshUsers = useCallback(async () => {
    const registeredUsers = await loadRegisteredUsers();
    setUsers(registeredUsers);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadRegisteredUsers(), loadAdminSchools()])
      .then(([registeredUsers, adminSchools]) => {
        if (!active) return;
        setUsers(registeredUsers);
        setSchools(adminSchools);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  const updateInvite = (field, value) => setInvite((current) => ({ ...current, [field]: value }));
  const submitInvite = async (event) => {
    event.preventDefault();
    const email = invite.email.trim().toLowerCase();
    if (!invite.displayName.trim()) return setInviteState({ status: 'error', message: 'Enter the invitee’s name.' });
    if (!EMAIL_PATTERN.test(email)) return setInviteState({ status: 'error', message: 'Enter a valid email address.' });
    if (invite.role === 'teacher' && !invite.schoolId) return setInviteState({ status: 'error', message: 'Choose a school for a teacher invitation.' });

    setInviteState({ status: 'submitting', message: 'Sending secure invitation…' });
    try {
      await provisionUser({ email, displayName: invite.displayName.trim(), role: invite.role, schoolId: invite.schoolId || undefined, redirectTo: window.location.origin });
      setInviteState({ status: 'success', message: `Invitation sent to ${email}.` });
      setInvite({ displayName: '', email: '', role: 'teacher', schoolId: '' });
      await refreshUsers();
    } catch (error) {
      setInviteState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to send the invitation.' });
    }
  };
  const submitAssignment = async (event) => {
    event.preventDefault();
    if (!assignment.studentId || !assignment.granteeId) {
      setAssignmentState({ status: 'error', message: 'Choose a student and an assigned teacher or specialist.' });
      return;
    }
    setAssignmentState({ status: 'loading', message: 'Saving the authorized assignment…' });
    try {
      await assignStudentAccess(assignment);
      setAssignmentState({ status: 'success', message: 'Student assignment saved. The staff member can now see this learner in their dashboard.' });
    } catch (error) {
      setAssignmentState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to save this assignment.' });
    }
  };
  const studentUsers = users.filter((user) => user.roles?.includes('student'));
  const staffUsers = users.filter((user) => user.roles?.includes(assignment.role));
  const selectedStudentUser = studentUsers.find((s) => s.id === inspectStudentId) ?? null;
  const inspectStudent = selectedStudentUser
    ? {
        id: selectedStudentUser.id,
        displayName: selectedStudentUser.display_name || selectedStudentUser.email || 'Learner',
        activityLog: selectedStudentUser.activityLog || [],
        sessionLog: selectedStudentUser.sessionLog || [],
        worldsCompleted: selectedStudentUser.worldsCompleted || {},
        xp: selectedStudentUser.xp || 0,
        sessionsCompleted: selectedStudentUser.sessionsCompleted || 0,
        totalTimeMs: selectedStudentUser.totalTimeMs || 0,
      }
    : null;

  return <div><TopBar worldColor="var(--amber)" showBack />
    <div className="panel-card" style={{ maxWidth: 960, margin: '40px auto 22px' }}>
      <h2>🏛️ Welcome, {displayName}!</h2>
      <p>A high-level view of the Lumora school learning space.</p>
      <div className="dash-grid" style={{ margin: '20px 0 0' }}>
        <div><div className="dash-label">Registered accounts</div><div className="dash-stat">{users.length}</div></div>
        <div><div className="dash-label">Student accounts</div><div className="dash-stat">{overview.students}</div></div>
        <div><div className="dash-label">Teachers</div><div className="dash-stat">{overview.teachers}</div></div>
        <div><div className="dash-label">Active accounts</div><div className="dash-stat">{overview.activeAccounts}</div></div>
      </div>
    </div>
    <div className="panel-card" style={{ maxWidth: 960, margin: '0 auto 22px' }}>
      <h3 style={{ marginTop: 0 }}>Add a School Account</h3>
      <p>Create a secure Lumora invitation. Roles are assigned only by the protected provisioning service.</p>
      <form onSubmit={submitInvite} style={{ display: 'grid', gap: 12, marginTop: 22 }}>
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', margin: 0 }}>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>Name<input value={invite.displayName} onChange={(event) => updateInvite('displayName', event.target.value)} placeholder="Full name" autoComplete="name" /></label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>Email<input type="email" value={invite.email} onChange={(event) => updateInvite('email', event.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>Role<select value={invite.role} onChange={(event) => updateInvite('role', event.target.value)}>{INVITABLE_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>School {invite.role === 'teacher' ? '(required)' : '(optional)'}<select value={invite.schoolId} onChange={(event) => updateInvite('schoolId', event.target.value)}><option value="">{schools.length ? 'No school selected' : 'No schools available'}</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
        </div>
        <button className="btn-pill btn-primary" style={{ justifySelf: 'start' }} disabled={inviteState.status === 'submitting'}>{inviteState.status === 'submitting' ? 'Sending invitation…' : 'Invite user'}</button>
        {inviteState.message && <p className={`auth-message ${inviteState.status === 'error' ? 'auth-error' : ''}`} role={inviteState.status === 'error' ? 'alert' : 'status'}>{inviteState.message}</p>}
      </form>
    </div>
    <div className="panel-card" style={{ maxWidth: 960, margin: '0 auto 22px' }}>
      <h3 style={{ marginTop: 0 }}>Assign a Student to a Teacher or Specialist</h3>
      <p>Only a school administrator can create these assignments. Staff dashboards show learners with an explicit assignment.</p>
      <form onSubmit={submitAssignment} style={{ display: 'grid', gap: 12, marginTop: 22 }}>
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', margin: 0 }}>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>Student<select value={assignment.studentId} onChange={(event) => setAssignment((current) => ({ ...current, studentId: event.target.value }))}><option value="">Choose student</option>{studentUsers.map((student) => <option key={student.id} value={student.id}>{student.display_name || student.email || 'Learner'}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>Staff role<select value={assignment.role} onChange={(event) => setAssignment((current) => ({ ...current, role: event.target.value, granteeId: '' }))}><option value="teacher">Teacher</option><option value="specialist">Specialist</option></select></label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--text-mid)', fontSize: 12, fontWeight: 700 }}>{assignment.role === 'teacher' ? 'Teacher' : 'Specialist'}<select value={assignment.granteeId} onChange={(event) => setAssignment((current) => ({ ...current, granteeId: event.target.value }))}><option value="">Choose {assignment.role}</option>{staffUsers.map((staff) => <option key={staff.id} value={staff.id}>{staff.display_name || staff.email || assignment.role}</option>)}</select></label>
        </div>
        <button className="ref-action-btn-primary" style={{ justifySelf: 'start' }} disabled={assignmentState.status === 'loading' || !studentUsers.length || !staffUsers.length}>{assignmentState.status === 'loading' ? 'Saving assignment…' : 'Assign learner'}</button>
        {assignmentState.message && <p className={`auth-message ${assignmentState.status === 'error' ? 'auth-error' : ''}`} role={assignmentState.status === 'error' ? 'alert' : 'status'}>{assignmentState.message}</p>}
        {!studentUsers.length && <p>No student accounts are available to assign.</p>}
        {!!studentUsers.length && !staffUsers.length && <p>No accounts with the selected staff role are available to assign.</p>}
      </form>
    </div>

    <div className="panel-card" style={{ maxWidth: 960, margin: '0 auto 22px' }}>
      <h3 style={{ marginTop: 0 }}>Student Learning Insights & Academic Oversight</h3>
      <p style={{ color: 'var(--text-mid)', fontSize: 13.5 }}>
        Review comprehensive, non-diagnostic learning patterns, domain evidence, and educational recommendations for enrolled students.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-mid)', fontSize: 13, fontWeight: 700 }}>
          Select Student:
          <select
            value={inspectStudentId}
            onChange={(e) => setInspectStudentId(e.target.value)}
            style={{ minHeight: 38, padding: '6px 12px', background: 'var(--bg-panel, #111424)', color: 'var(--text-hi, #E2E8F0)', border: '1px solid var(--border-glow, rgba(184, 226, 250, 0.25))', borderRadius: 4 }}
          >
            <option value="">All enrolled students (or sample preview)</option>
            {studentUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name || s.email || 'Learner'}
              </option>
            ))}
          </select>
        </label>
        <LearningInsightsEntryPoint learner={inspectStudent || { displayName: 'Learner' }} />
      </div>
    </div>

    <LearningInsightsReport learner={inspectStudent} role="school_admin" />

    <div className="panel-card" style={{ maxWidth: 960, margin: '0 auto 40px' }}>
      <h3 style={{ marginTop: 0 }}>Registered Lumora Accounts</h3>
      <p>This information is visible only to school administrators.</p>
      {status === 'loading' && <p>Loading registered users…</p>}
      {status === 'error' && <p className="auth-error">Unable to load registered users or schools. Please try again.</p>}
      {status === 'ready' && <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Last sign-in</th><th>Status</th></tr></thead>
        <tbody>{users.map((registeredUser) => <tr key={registeredUser.id}>
          <td>{registeredUser.display_name || 'Learner'}</td><td>{registeredUser.email}</td><td>{registeredUser.roles?.join(', ') || '—'}</td><td>{formatDate(registeredUser.created_at)}</td><td>{formatDate(registeredUser.last_sign_in_at)}</td><td>{registeredUser.account_status}</td>
        </tr>)}</tbody>
      </table>{!users.length && <p>No registered users yet.</p>}</div>}
    </div>
    <Mascot color="var(--amber)" icon="🏛️" message={`Your Lumora school space is ready, ${displayName}.`} />
  </div>;
}
