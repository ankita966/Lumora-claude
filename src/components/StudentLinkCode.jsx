import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useGameStore } from '../store/useGameStore';
import { createStudentLinkCode, getLinkCodeDetails } from '../services/linkedStudents';
import LearningInsightsReport from '../dashboards/LearningInsightsReport';
import { playClick, playChime } from '../lib/soundFx';

export default function StudentLinkCode() {
  const { user, roles, displayName } = useAuth();
  const { xp, activityLog, worldsCompleted, sessionsCompleted, totalTimeMs } = useGameStore();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'enter'
  const [createState, setCreateState] = useState({ status: 'idle', code: '', expiresAt: null, copied: false, message: '' });
  const [pasteCode, setPasteCode] = useState('');
  const [lookupState, setLookupState] = useState({ status: 'idle', learner: null, error: '' });
  const [showLookupReport, setShowLookupReport] = useState(false);

  if (!user || !roles.includes('student')) return null;

  const handleCreate = async () => {
    playClick(0.5);
    setCreateState({ status: 'loading', code: '', expiresAt: null, copied: false, message: 'Creating your family link code…' });
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
        message: 'Share this link code with your parent to connect your accounts.',
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

  const handleLookup = (e) => {
    e.preventDefault();
    if (!pasteCode.trim()) return;
    playClick(0.5);
    setLookupState({ status: 'loading', learner: null, error: '' });
    setShowLookupReport(false);

    const found = getLinkCodeDetails(pasteCode);
    if (found) {
      playChime(1.3, 0.4);
      setLookupState({ status: 'success', learner: found, error: '' });
    } else {
      setLookupState({
        status: 'error',
        learner: null,
        error: 'That link code is invalid or expired. Check the code and try again.',
      });
    }
  };

  return (
    <section className="panel-card" style={{ maxWidth: 660, margin: '0 auto 24px', textAlign: 'center' }} aria-labelledby="family-link-title">
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`mode-chip ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => { playClick(0.3); setActiveTab('create'); }}
          style={{ cursor: 'pointer' }}
        >
          Share with Parent
        </button>
        <button
          type="button"
          className={`mode-chip ${activeTab === 'enter' ? 'active' : ''}`}
          onClick={() => { playClick(0.3); setActiveTab('enter'); }}
          style={{ cursor: 'pointer' }}
        >
          Enter a Link Code
        </button>
      </div>

      {activeTab === 'create' ? (
        <div>
          <h2 id="family-link-title" style={{ marginTop: 0, color: 'var(--text-hi)', fontSize: 20 }}>
            Share Progress with a Parent
          </h2>
          <p style={{ color: 'var(--text-mid)', fontSize: 14 }}>
            Create a one-time code and share it with your parent. They can paste it in their Parent Portal to see your progress and learning insights.
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
                {createState.message} (Expires in 30 minutes)
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
                {createState.status === 'loading' ? 'Creating code…' : 'Create Family Link Code'}
              </button>
              {createState.message && (
                <p role="alert" className="auth-error" style={{ marginTop: 12 }}>
                  {createState.message}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 id="family-link-title" style={{ marginTop: 0, color: 'var(--text-hi)', fontSize: 20 }}>
            Enter a Shared Link Code
          </h2>
          <p style={{ color: 'var(--text-mid)', fontSize: 14 }}>
            Paste a link code from another student or demo account to view their recorded details and Learning Insights report.
          </p>

          <form onSubmit={handleLookup} style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
            <input
              value={pasteCode}
              onChange={(e) => setPasteCode(e.target.value)}
              placeholder="e.g. LUMORA-XXXXXX or Alex"
              autoComplete="off"
              style={{
                minWidth: 260,
                padding: '8px 14px',
                background: 'var(--bg-panel, #111424)',
                color: 'var(--text-hi)',
                border: '1px solid var(--border-glow)',
                borderRadius: 4,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
              }}
            />
            <button
              type="submit"
              className="ref-action-btn-primary"
              disabled={!pasteCode.trim()}
              style={{ minHeight: 40 }}
            >
              Get Details
            </button>
          </form>

          {lookupState.error && (
            <p role="alert" className="auth-error" style={{ margin: '10px 0' }}>
              {lookupState.error}
            </p>
          )}

          {lookupState.learner && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: 'rgba(72, 184, 208, 0.1)',
                border: '1px solid var(--azure)',
                borderRadius: 6,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 17, color: 'var(--text-hi)' }}>{lookupState.learner.displayName}</strong>
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
                    ⭐ {lookupState.learner.xp?.toLocaleString()} XP · {Object.keys(lookupState.learner.worldsCompleted || {}).length}/5 Realms Mastered · {lookupState.learner.activityLog?.length || 0} Rounds Logged
                  </div>
                </div>
                <button
                  type="button"
                  className="ref-action-btn-primary"
                  onClick={() => { playClick(0.5); setShowLookupReport((prev) => !prev); }}
                  style={{ fontSize: 13, padding: '6px 14px' }}
                >
                  {showLookupReport ? '✕ Hide Report' : '📊 View Learning Insights'}
                </button>
              </div>

              {showLookupReport && (
                <div style={{ marginTop: 20 }}>
                  <LearningInsightsReport learner={lookupState.learner} role="student" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
