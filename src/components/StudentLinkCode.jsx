import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useGameStore } from '../store/useGameStore';
import { createStudentLinkCode, getActiveStudentCode } from '../services/linkedStudents';
import { playClick, playChime } from '../lib/soundFx';

export default function StudentLinkCode() {
  const { user, roles, displayName } = useAuth();
  const { xp, activityLog, worldsCompleted, sessionsCompleted, totalTimeMs } = useGameStore();
  const [createState, setCreateState] = useState({ status: 'idle', code: '', expiresAt: null, copied: false, message: '' });

  if (!user || !roles.includes('student')) return null;

  const handleCreate = async () => {
    playClick(0.5);
    setCreateState({ status: 'loading', code: '', expiresAt: null, copied: false, message: 'Creating your student link code…' });
    try {
      const snapshot = {
        id: user.id,
        displayName: displayName || user.email?.split('@')[0] || 'Learner',
        xp,
        activityLog,
        worldsCompleted,
        sessionsCompleted,
        totalTimeMs,
      };
      const result = await createStudentLinkCode(snapshot);
      playChime(1.2, 0.5);
      setCreateState({
        status: 'ready',
        code: result.link_code,
        expiresAt: result.expires_at,
        copied: false,
        message: 'Share this link code with your parent or teacher to connect your accounts.',
      });
    } catch (err) {
      setCreateState({
        status: 'error',
        code: '',
        expiresAt: null,
        copied: false,
        message: err instanceof Error ? err.message : 'Unable to create link code. Please try again.',
      });
    }
  };

  const handleCopy = async () => {
    if (!createState.code) return;
    playClick(0.4);
    try {
      await navigator.clipboard.writeText(createState.code);
      setCreateState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setCreateState((prev) => ({ ...prev, copied: false })), 2500);
    } catch {
      /* clipboard write rejected */
    }
  };

  useEffect(() => {
    if (!user || !roles.includes('student')) return;
    const existing = getActiveStudentCode(user.id);
    if (existing) {
      setCreateState({
        status: 'ready',
        code: existing.code,
        expiresAt: existing.expiresAt,
        copied: false,
        message: 'Share this link code with your parent or teacher to connect your accounts.',
      });
      return;
    }
    // Automatically generate unique code on opening the student section
    handleCreate();
  }, [user?.id]);

  return (
    <section className="panel-card" style={{ maxWidth: 660, margin: '0 auto 24px', textAlign: 'center' }} aria-labelledby="student-link-title">
      <div>
        <h2 id="student-link-title" style={{ marginTop: 0, color: 'var(--text-hi)', fontSize: 20 }}>
          Share Progress with Parent or Teacher
        </h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 14 }}>
          Here is your unique student link code. Share it with your parent, teacher, or specialist. They can enter it in their portal to connect your accounts and view your learning insights.
        </p>

        {createState.code ? (
          <div aria-live="polite" style={{ margin: '18px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                background: 'rgba(56, 182, 255, 0.1)',
                border: '2px solid var(--cyan)',
                borderRadius: 6,
                boxShadow: '3px 3px 0 #000',
              }}
            >
              <code
                style={{
                  color: 'var(--cyan)',
                  fontSize: 'clamp(20px, 5vw, 28px)',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {createState.code}
              </code>
              <button
                type="button"
                className="ref-action-btn-primary"
                onClick={handleCopy}
                style={{ minHeight: 36, padding: '4px 12px', fontSize: 13 }}
                title="Copy code to clipboard"
              >
                {createState.copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            <p style={{ color: 'var(--text-mid)', fontSize: 13, marginTop: 10 }}>
              {createState.message}{' '}
              {createState.expiresAt ? (
                <span>
                  (Expires at {new Date(createState.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, valid for 30 minutes)
                </span>
              ) : (
                <span>(Expires in 30 minutes)</span>
              )}
            </p>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="ref-action-btn-secondary"
                onClick={handleCreate}
                style={{ fontSize: 13 }}
              >
                ↻ Generate New Code
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin: '18px 0' }}>
            <button
              type="button"
              className="ref-action-btn-primary"
              onClick={handleCreate}
              disabled={createState.status === 'loading'}
            >
              {createState.status === 'loading' ? 'Creating code…' : 'Create Student Link Code'}
            </button>
            {createState.message && (
              <p role="alert" className="auth-error" style={{ marginTop: 12 }}>
                {createState.message}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
