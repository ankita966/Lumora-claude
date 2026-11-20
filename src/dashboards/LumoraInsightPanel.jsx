import React, { useState, useEffect, useCallback } from 'react';
import { fetchGeminiInsights } from '../services/geminiInsights';
import { WORLDS } from '../data/worlds';

/**
 * World color and icon helper matching Lumora's 5 realms.
 */
const WORLD_METAS = {
  soundForest: { name: 'Sound Forest', icon: '🌲', color: 'var(--cyan, #38B6FF)' },
  storyCastle: { name: 'Story Castle', icon: '🏰', color: 'var(--amber, #E5A83B)' },
  runeRealm: { name: 'Rune Realm', icon: '✍️', color: 'var(--magenta, #FF2E93)' },
  memoryMountains: { name: 'Memory Mountains', icon: '🧠', color: 'var(--lavender, #A47BE0)' },
  visionValley: { name: 'Vision Valley', icon: '👁️', color: 'var(--azure, #48B8D0)' },
};

/**
 * LumoraInsightPanel — Gemini-Powered Learning Insights Component
 *
 * Provides evidence-based, strengths-first insights generated securely
 * by Google Gemini (or transparently labeled rule-based fallback).
 */
export default function LumoraInsightPanel({
  learner,
  role = 'teacher',
  selectedWorld = 'all',
}) {
  const [loading, setLoading] = useState(false);
  const [insightResult, setInsightResult] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  const loadInsights = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setErrorNotice(null);
      try {
        const res = await fetchGeminiInsights({
          learner,
          role,
          selectedWorld,
          forceRefresh,
        });
        setInsightResult(res);
      } catch (err) {
        setErrorNotice(err.message || 'Unable to generate learning insights.');
      } finally {
        setLoading(false);
      }
    },
    [learner, role, selectedWorld]
  );

  useEffect(() => {
    loadInsights(false);
  }, [loadInsights]);

  const isGemini = insightResult?.source === 'gemini';
  const data = insightResult?.data;

  // Perspective tailored notes
  const perspectiveHints = {
    teacher: 'Educator Lens: Use observed strengths to scaffold small-group intervention and classroom accommodations.',
    parent: 'Family Lens: Celebrate progress and persistence at home! Keep practice sessions playful, positive, and under 10 minutes.',
    specialist: 'Specialist Lens: Analyze attempts and time metrics to distinguish task unfamiliarity from genuine cognitive load.',
    student: 'Explorer Mode: Awesome work! Check out your superpower strengths and see which magical realm to visit next!',
    school_admin: 'Administrative Lens: High-level overview of multi-realm engagement, skill coverage, and longitudinal growth.',
  };

  return (
    <section
      className="lumora-insight-panel"
      aria-labelledby="lumora-insight-heading"
      role="region"
    >
      {/* Panel Header */}
      <div className="lumora-insight-header">
        <div className="lumora-insight-title-group">
          <div className="lumora-insight-sparkle-badge" aria-hidden="true">
            ✨
          </div>
          <div>
            <div className="lumora-insight-title-row">
              <h3 id="lumora-insight-heading" className="lumora-insight-title">
                LUMORA INSIGHT
              </h3>
              {insightResult && (
                <span
                  className={`lumora-source-badge ${isGemini ? 'source-gemini' : 'source-fallback'}`}
                  title={insightResult.notice}
                >
                  {isGemini
                    ? `✨ ${insightResult.engine || 'Gemini 2.5 Flash'}`
                    : '🛡️ Offline Fallback (Non-AI)'}
                </span>
              )}
            </div>
            <p className="lumora-insight-subtitle">
              Intelligent Learning Synthesis · Powered by Google Gemini · Strengths-First & Non-Diagnostic
            </p>
          </div>
        </div>

        <div className="lumora-insight-actions">
          <button
            type="button"
            className="lumora-refresh-btn"
            onClick={() => loadInsights(true)}
            disabled={loading}
            aria-label="Refresh Gemini Learning Insights"
          >
            {loading ? (
              <>
                <span className="lumora-spin-icon" aria-hidden="true">⏳</span>
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">↻</span>
                <span>Regenerate Insights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attribution & Notice Bar */}
      {insightResult?.notice && (
        <div
          className={`lumora-notice-bar ${isGemini ? 'gemini-notice' : 'fallback-notice'}`}
          role="status"
        >
          <span className="lumora-notice-icon" aria-hidden="true">
            {isGemini ? '✨' : 'ℹ️'}
          </span>
          <span className="lumora-notice-text">{insightResult.notice}</span>
        </div>
      )}

      {/* Error state if fetch failed completely */}
      {errorNotice && (
        <div className="lumora-error-callout" role="alert">
          <strong>Notice: </strong>
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Role Perspective Context Banner */}
      <div className="lumora-role-lens-banner">
        <span className="lumora-lens-tag">
          {role.toUpperCase()} PERSPECTIVE
        </span>
        <span className="lumora-lens-text">
          {perspectiveHints[role] || perspectiveHints.teacher}
        </span>
      </div>

      {/* Loading State: Retro Arcade Progress Skeleton */}
      {loading && !data && (
        <div className="lumora-loading-container" aria-live="polite">
          <div className="lumora-loading-pixel-box">
            <span className="lumora-loading-title">SYNTHESIZING LEARNING EVIDENCE</span>
            <p className="lumora-loading-sub">
              Querying Google Gemini with pseudonymised gameplay metrics across Lumora’s 5 realms…
            </p>
            <div className="lumora-loading-progress-bar">
              <div className="lumora-loading-progress-fill" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {data && (
        <div className="lumora-insight-body">
          {/* Executive Summary Card */}
          <div className="lumora-summary-card">
            <div className="lumora-card-heading">
              <span className="lumora-card-icon" aria-hidden="true">🌟</span>
              <h4>Strengths-First Summary</h4>
            </div>
            <p className="lumora-summary-text">{data.summary}</p>
          </div>

          {/* Grid: Strengths & Areas for Practice */}
          <div className="lumora-two-col-grid">
            {/* Strengths Column */}
            <div className="lumora-grid-col strengths-col">
              <div className="lumora-col-header">
                <span className="lumora-col-icon" aria-hidden="true">⭐</span>
                <h4 className="lumora-col-title">Observed Strengths & Mastery</h4>
              </div>

              {Array.isArray(data.strengths) && data.strengths.length > 0 ? (
                <div className="lumora-card-stack">
                  {data.strengths.map((item, idx) => {
                    const worldMeta = WORLD_METAS[item.world] || {
                      name: item.world || 'Realm',
                      icon: '✨',
                      color: 'var(--cyan)',
                    };
                    return (
                      <article key={`str-${idx}`} className="lumora-feature-card strength">
                        <div className="lumora-card-top">
                          <span
                            className="lumora-world-tag"
                            style={{ borderColor: worldMeta.color, color: worldMeta.color }}
                          >
                            <span aria-hidden="true">{worldMeta.icon}</span> {worldMeta.name}
                          </span>
                          <span className="lumora-domain-pill">{item.domain}</span>
                        </div>
                        <p className="lumora-card-desc">{item.description}</p>
                        {item.highlight && (
                          <div className="lumora-card-highlight">
                            <strong>Highlight: </strong> {item.highlight}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="lumora-empty-msg">
                  Strengths will be highlighted as more gameplay rounds are completed.
                </p>
              )}
            </div>

            {/* Areas for Practice Column */}
            <div className="lumora-grid-col practice-col">
              <div className="lumora-col-header">
                <span className="lumora-col-icon" aria-hidden="true">🎯</span>
                <h4 className="lumora-col-title">Areas Where Extra Support May Help</h4>
              </div>

              {Array.isArray(data.practiceAreas) && data.practiceAreas.length > 0 ? (
                <div className="lumora-card-stack">
                  {data.practiceAreas.map((item, idx) => {
                    const worldMeta = WORLD_METAS[item.world] || {
                      name: item.world || 'Realm',
                      icon: '🎯',
                      color: 'var(--amber)',
                    };
                    return (
                      <article key={`pra-${idx}`} className="lumora-feature-card practice">
                        <div className="lumora-card-top">
                          <span
                            className="lumora-world-tag"
                            style={{ borderColor: worldMeta.color, color: worldMeta.color }}
                          >
                            <span aria-hidden="true">{worldMeta.icon}</span> {worldMeta.name}
                          </span>
                          <span className="lumora-domain-pill">{item.domain}</span>
                        </div>
                        <p className="lumora-card-desc">{item.description}</p>
                        {item.rationale && (
                          <div className="lumora-rationale-box">
                            <strong>Why practice helps: </strong> {item.rationale}
                          </div>
                        )}
                        {item.supportiveSuggestion && (
                          <div className="lumora-suggestion-box">
                            <strong>Supportive strategy: </strong> {item.supportiveSuggestion}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="lumora-empty-msg">
                  No repeated challenge areas identified in recorded activity.
                </p>
              )}
            </div>
          </div>

          {/* Progress & Persistence Observations */}
          {Array.isArray(data.progressObservations) && data.progressObservations.length > 0 && (
            <div className="lumora-progress-box">
              <div className="lumora-card-heading">
                <span className="lumora-card-icon" aria-hidden="true">📈</span>
                <h4>Progress & Persistence Across Sessions</h4>
              </div>
              <div className="lumora-obs-chips-grid">
                {data.progressObservations.map((obs, idx) => {
                  const trend = String(obs.trend || 'steady').toLowerCase();
                  const trendLabel =
                    trend === 'improving' ? '📈 Improving Trend' :
                    trend === 'steady' ? '⚖️ Steady Mastery' : '🌱 Developing Skill';
                  return (
                    <div key={`obs-${idx}`} className={`lumora-obs-chip trend-${trend}`}>
                      <span className="lumora-trend-tag">{trendLabel}</span>
                      <p className="lumora-trend-text">{obs.observation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Next Lumora Quests */}
          {Array.isArray(data.recommendedActivities) && data.recommendedActivities.length > 0 && (
            <div className="lumora-recommended-section">
              <div className="lumora-card-heading">
                <span className="lumora-card-icon" aria-hidden="true">🗺️</span>
                <h4>Recommended Next Learning Quests</h4>
              </div>
              <div className="lumora-recommended-grid">
                {data.recommendedActivities.map((act, idx) => {
                  const worldMeta = WORLD_METAS[act.world] || {
                    name: act.world || 'Realm',
                    icon: '🎮',
                    color: 'var(--cyan)',
                  };
                  return (
                    <div key={`rec-${idx}`} className="lumora-rec-card">
                      <div className="lumora-rec-badge" style={{ color: worldMeta.color }}>
                        <span aria-hidden="true">{worldMeta.icon}</span> {worldMeta.name}
                      </div>
                      <h5 className="lumora-rec-title">{act.activityTitle}</h5>
                      <p className="lumora-rec-focus">
                        <strong>Focus: </strong>
                        {act.focus}
                      </p>
                      {act.encouragingNote && (
                        <p className="lumora-rec-note">“{act.encouragingNote}”</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy & Non-Diagnostic Guarantee */}
          <footer className="lumora-panel-footer">
            <div className="lumora-footer-badges">
              <span className="lumora-footer-pill">🔒 Zero PII Transmitted</span>
              <span className="lumora-footer-pill">📊 Grounded in Recorded Gameplay Only</span>
              <span className="lumora-footer-pill">🛡️ Strictly Non-Diagnostic</span>
              <span className="lumora-footer-pill">💖 Strengths-First Design</span>
            </div>
            <p className="lumora-footer-disclaimer">
              Lumora Insight utilizes Google Gemini to provide formative educational support.
              It does not diagnose medical or cognitive conditions, compute clinical risk indices,
              or replace professional educational evaluations.
            </p>
          </footer>
        </div>
      )}
    </section>
  );
}

