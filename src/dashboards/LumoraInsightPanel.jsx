import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchGeminiInsights } from '../services/geminiInsights';
import { WORLD_ROUNDS } from './LearningInsightsReport';
import { WORLDS, WORLD_ORDER } from '../data/worlds';

/**
 * World definitions & construct mappings strictly matching project specifications.
 */
const WORLD_SPECS = {
  soundForest: {
    key: 'soundForest',
    name: 'Sound Forest',
    icon: '🌲',
    color: '#38B6FF',
    constructs: 'Phonological awareness · Letter-sound recognition · Phoneme blending · Auditory discrimination · Spoken pronunciation',
    shortFocus: 'Phonological Awareness & Speech',
    conditionKey: 'dyslexia',
  },
  visionValley: {
    key: 'visionValley',
    name: 'Vision Valley',
    icon: '👁️',
    color: '#48B8D0',
    constructs: 'Visual tracking · Smooth pursuit · Saccadic target acquisition · Visual discrimination · Visual-motor timing',
    shortFocus: 'Visual Processing & Attention',
    conditionKey: null,
  },
  storyCastle: {
    key: 'storyCastle',
    name: 'Story Castle',
    icon: '🏰',
    color: '#E5A83B',
    constructs: 'Sight-word recognition · Sentence decoding · Reading fluency · Story sequencing · Reading comprehension',
    shortFocus: 'Reading Fluency & Comprehension',
    conditionKey: 'dyslexia',
  },
  runeRealm: {
    key: 'runeRealm',
    name: 'Rune Realm',
    icon: '✍️',
    color: '#FF2E93',
    constructs: 'Letter formation · Number formation · Fine-motor coordination · Tracing precision · Continuous stroke planning',
    shortFocus: 'Handwriting & Fine-Motor Planning',
    conditionKey: 'dysgraphia',
  },
  memoryMountains: {
    key: 'memoryMountains',
    name: 'Memory Mountains',
    icon: '🧠',
    color: '#A47BE0',
    constructs: 'Visual working memory · Object recall · Sequential recall · Pattern recognition · Memory updating',
    shortFocus: 'Working Memory & Relational Pattern Logic',
    conditionKey: 'dyscalculia',
  },
};

/**
 * Pure SVG Donut Chart for completion percentage.
 */
function DonutChart({ completed = 0, total = 5, size = 76, stroke = 7, color = '#38B6FF' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className="lumora-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(184, 226, 250, 0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="lumora-donut-label">
        <span className="donut-num">{completed}/{total}</span>
        <span className="donut-pct">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}

/**
 * Pure SVG Bar Chart for Activity-wise Accuracy within a World.
 */
function ActivityBarChart({ roundsData, color = '#38B6FF' }) {
  if (!roundsData || roundsData.length === 0) {
    return (
      <div className="lumora-chart-empty">
        <p>No activity records logged in this realm yet.</p>
      </div>
    );
  }

  const width = 480;
  const height = 180;
  const padLeft = 40;
  const padBottom = 32;
  const padTop = 18;
  const chartW = width - padLeft - 16;
  const chartH = height - padBottom - padTop;
  const barGap = 16;
  const barW = Math.max(16, (chartW - barGap * (roundsData.length + 1)) / roundsData.length);

  return (
    <div className="lumora-chart-card">
      <div className="lumora-chart-header">
        <h5 className="lumora-chart-title">Activity-Wise Accuracy</h5>
        <span className="lumora-chart-legend">
          <span className="legend-line" /> Target Mastery (80%)
        </span>
      </div>
      <svg
        className="lumora-svg-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Activity-wise accuracy bar chart"
      >
        {/* Grid lines: 0%, 50%, 80% (target), 100% */}
        {[0, 0.5, 0.8, 1].map((val) => {
          const y = padTop + chartH - val * chartH;
          const isTarget = val === 0.8;
          return (
            <g key={val}>
              <line
                x1={padLeft}
                x2={width - 12}
                y1={y}
                y2={y}
                stroke={isTarget ? 'var(--amber, #E5A83B)' : 'rgba(184, 226, 250, 0.12)'}
                strokeDasharray={isTarget ? '4 3' : '2 2'}
                strokeWidth={isTarget ? 1.5 : 1}
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill={isTarget ? 'var(--amber, #E5A83B)' : 'var(--text-low, #64748B)'}
                fontFamily="var(--font-body)"
              >
                {Math.round(val * 100)}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {roundsData.map((item, idx) => {
          const x = padLeft + barGap + idx * (barW + barGap);
          const hasPlayed = typeof item.accuracy === 'number';
          const acc = hasPlayed ? Math.min(1, Math.max(0, item.accuracy)) : 0;
          const barH = hasPlayed ? Math.max(4, acc * chartH) : 0;
          const y = padTop + chartH - barH;

          return (
            <g key={item.round || idx} className="lumora-bar-group">
              <title>{`${item.title}: ${hasPlayed ? `${Math.round(acc * 100)}% accuracy (${item.attempts || 1} attempt${(item.attempts || 1) === 1 ? '' : 's'})` : 'Not yet attempted'}`}</title>
              {/* Background slot */}
              <rect
                x={x}
                y={padTop}
                width={barW}
                height={chartH}
                fill="rgba(184, 226, 250, 0.04)"
                rx="3"
              />
              {/* Actual bar */}
              {hasPlayed ? (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={acc >= 0.8 ? color : 'var(--amber, #E5A83B)'}
                  rx="3"
                  className="lumora-chart-bar"
                />
              ) : (
                <line
                  x1={x + 4}
                  x2={x + barW - 4}
                  y1={padTop + chartH - 2}
                  y2={padTop + chartH - 2}
                  stroke="rgba(184, 226, 250, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              )}
              {/* Value on top of bar */}
              {hasPlayed && (
                <text
                  x={x + barW / 2}
                  y={Math.max(padTop + 10, y - 5)}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-hi, #E2E8F0)"
                  fontFamily="var(--font-pixel-heading, monospace)"
                  fontWeight="bold"
                >
                  {Math.round(acc * 100)}%
                </text>
              )}
              {/* X label */}
              <text
                x={x + barW / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-silver, #CBD5E1)"
                fontFamily="var(--font-pixel-heading, monospace)"
              >
                R{item.round}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Pure SVG Line Chart for Cross-Session Longitudinal Trends.
 */
function SessionLineChart({ sessionPoints, color = '#38B6FF' }) {
  if (!sessionPoints || sessionPoints.length < 2) {
    return (
      <div className="lumora-chart-card empty-trend">
        <div className="lumora-chart-header">
          <h5 className="lumora-chart-title">Session-Wise Trend</h5>
          <span className="lumora-trend-badge single">1 Session Recorded</span>
        </div>
        <div className="lumora-chart-empty">
          <p>Multi-session trend comparison will appear once subsequent sessions are recorded for this realm.</p>
          <span className="lumora-empty-sub">Lumora reports authentic gameplay history without fabricating unrecorded past sessions.</span>
        </div>
      </div>
    );
  }

  const width = 480;
  const height = 180;
  const padLeft = 40;
  const padBottom = 32;
  const padTop = 18;
  const chartW = width - padLeft - 16;
  const chartH = height - padBottom - padTop;

  const pts = sessionPoints.map((pt, idx) => {
    const x = padLeft + (idx / (sessionPoints.length - 1)) * chartW;
    const y = padTop + chartH - Math.min(1, Math.max(0, pt.accuracy)) * chartH;
    return { x, y, pt };
  });

  const polylineStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="lumora-chart-card">
      <div className="lumora-chart-header">
        <h5 className="lumora-chart-title">Session-Wise Accuracy Progress</h5>
        <span className="lumora-trend-badge multi">{sessionPoints.length} Sessions Logged</span>
      </div>
      <svg
        className="lumora-svg-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cross-session accuracy line chart"
      >
        {/* Horizontal grid */}
        {[0, 0.5, 0.8, 1].map((val) => {
          const y = padTop + chartH - val * chartH;
          return (
            <g key={val}>
              <line
                x1={padLeft}
                x2={width - 12}
                y1={y}
                y2={y}
                stroke="rgba(184, 226, 250, 0.12)"
                strokeDasharray="2 2"
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-low, #64748B)"
                fontFamily="var(--font-body)"
              >
                {Math.round(val * 100)}%
              </text>
            </g>
          );
        })}

        {/* Polyline */}
        <polyline
          points={polylineStr}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={color}
              stroke="var(--bg-space, #090B14)"
              strokeWidth="2"
            />
            <title>{`Session ${idx + 1}: ${Math.round(p.pt.accuracy * 100)}% (${new Date(p.pt.ts).toLocaleDateString()})`}</title>
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-hi, #E2E8F0)"
              fontFamily="var(--font-pixel-heading, monospace)"
              fontWeight="bold"
            >
              {Math.round(p.pt.accuracy * 100)}%
            </text>
            <text
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-silver, #CBD5E1)"
              fontFamily="var(--font-pixel-heading, monospace)"
            >
              S{idx + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * LumoraInsightPanel — Complete World-Wise Learning Evidence & Support Analysis
 */
export default function LumoraInsightPanel({
  learner,
  role = 'teacher',
  selectedWorld = 'all',
}) {
  const [activeTab, setActiveTab] = useState(selectedWorld || 'all');
  const [loading, setLoading] = useState(false);
  const [insightResult, setInsightResult] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  // Sync activeTab with parent's selectedWorld if changed externally
  useEffect(() => {
    if (selectedWorld && selectedWorld !== activeTab) {
      setActiveTab(selectedWorld);
    }
  }, [selectedWorld]);

  const loadInsights = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setErrorNotice(null);
      try {
        const res = await fetchGeminiInsights({
          learner,
          role,
          selectedWorld: 'all', // Send all activities to get holistic multi-world response
          forceRefresh,
        });
        setInsightResult(res);
      } catch (err) {
        setErrorNotice(err.message || 'Unable to generate learning insights.');
      } finally {
        setLoading(false);
      }
    },
    [learner, role]
  );

  useEffect(() => {
    loadInsights(false);
  }, [loadInsights]);

  const isGemini = insightResult?.source === 'gemini';
  const data = insightResult?.data;
  const worldInsights = data?.worldInsights || {};

  // Extract learner telemetry by world
  const learnerTelemetry = useMemo(() => {
    const rawActivities = Array.isArray(learner?.activityLog) ? learner.activityLog : [];
    const rawSessions = Array.isArray(learner?.sessionLog) ? learner.sessionLog : [];

    const result = {};
    for (const worldKey of WORLD_ORDER) {
      const catalogRounds = WORLD_ROUNDS[worldKey] || [];
      const worldActs = rawActivities.filter((a) => a.world === worldKey);
      const worldSessions = rawSessions.filter((s) => s.world === worldKey);

      const totalTimeMs = worldActs.reduce(
        (sum, a) => sum + (Number.isFinite(a.timeMs) ? a.timeMs : 0),
        0
      );
      const totalAttempts = worldActs.reduce(
        (sum, a) => sum + (Number.isFinite(a.attempts) ? a.attempts : 1),
        0
      );
      const avgAccuracy =
        worldActs.length > 0
          ? worldActs.reduce((sum, a) => sum + (Number(a.accuracy) || 0), 0) / worldActs.length
          : null;
      const avgAttempts = worldActs.length > 0 ? totalAttempts / worldActs.length : null;

      // Map catalog rounds with actual learner metrics
      const roundsWithMetrics = catalogRounds.map((catRound) => {
        const matchingActs = worldActs.filter((a) => a.round === catRound.round);
        if (matchingActs.length === 0) {
          return {
            ...catRound,
            played: false,
            accuracy: null,
            attempts: 0,
            timeMs: 0,
            hints: 0,
          };
        }
        const lastAct = matchingActs[matchingActs.length - 1];
        const roundAvgAcc =
          matchingActs.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) / matchingActs.length;
        const roundTotalAttempts = matchingActs.reduce((s, a) => s + (Number(a.attempts) || 1), 0);
        const roundTime = matchingActs.reduce((s, a) => s + (Number(a.timeMs) || 0), 0);
        const roundHints = matchingActs.reduce((s, a) => s + (Number(a.hints) || 0), 0);

        return {
          ...catRound,
          played: true,
          accuracy: roundAvgAcc,
          attempts: roundTotalAttempts,
          timeMs: roundTime,
          hints: roundHints,
          lastPlayedTs: lastAct.ts,
        };
      });

      // Session trend points for this world
      const sessionMap = new Map();
      worldActs
        .filter((a) => a.sessionId && Number.isFinite(a.accuracy))
        .forEach((a) => {
          if (!sessionMap.has(a.sessionId)) {
            sessionMap.set(a.sessionId, { acts: [], ts: a.ts || Date.now() });
          }
          sessionMap.get(a.sessionId).acts.push(a);
        });

      const sessionPoints = [...sessionMap.entries()]
        .map(([sessId, obj]) => ({
          sessionId: sessId,
          ts: obj.ts,
          accuracy: obj.acts.reduce((s, a) => s + a.accuracy, 0) / obj.acts.length,
          count: obj.acts.length,
        }))
        .sort((a, b) => a.ts - b.ts);

      const completedCount = roundsWithMetrics.filter((r) => r.played).length;
      const dataSufficiency =
        completedCount === 0 ? 'no_data' : completedCount === 1 ? 'insufficient' : 'sufficient';

      result[worldKey] = {
        worldKey,
        worldMeta: WORLD_SPECS[worldKey],
        activities: worldActs,
        sessions: worldSessions,
        roundsWithMetrics,
        sessionPoints,
        completedCount,
        totalCatalogCount: catalogRounds.length,
        avgAccuracy,
        avgAttempts,
        totalTimeMs,
        dataSufficiency,
      };
    }

    return result;
  }, [learner]);

  // Format milliseconds into human string
  const formatTime = (ms) => {
    if (!ms || !Number.isFinite(ms)) return '0s';
    const totalSec = Math.round(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Role Perspective Descriptions & Tailored Guidance
  const roleGuidance = {
    parent: {
      tag: 'FAMILY & HOME GUIDANCE',
      tone: 'Simple, encouraging observations focusing on daily strengths and fun offline play.',
      homeStrategies: [
        'Celebrate persistence rather than speed. Praise effort: "You solved that tricky rune with great focus!"',
        'Keep home practice short (5–10 minutes) and playful to prevent cognitive fatigue.',
        'Pair game quests with sensory play (tracing in flour/sand, rhyming songs, shared bedtime reading).',
      ],
    },
    teacher: {
      tag: 'EDUCATOR & CLASSROOM STRATEGIES',
      tone: 'Activity-level curriculum alignment, multi-sensory scaffolding, and accommodations.',
      homeStrategies: [
        'Provide multi-sensory scaffolding: pair auditory instructions with visual icons or charts.',
        'Allow flexible response options (verbal responses, speech-to-text, or graphic organizers).',
        'Use observed strengths in one realm (e.g. strong memory) to scaffold developing areas (e.g. reading).',
      ],
    },
    specialist: {
      tag: 'SPECIALIST & CLINICAL PERSPECTIVE',
      tone: 'Detailed attempt-to-time telemetry, cognitive load differentiation, and evidence limits.',
      homeStrategies: [
        'Distinguish retrieval latency from task unfamiliarity by comparing single-attempt vs multi-attempt rounds.',
        'Note that repeated in-game attempts reflect active learning and do not establish clinical diagnoses.',
        'Use multi-session trend lines to identify whether difficulties persist across distinct days.',
      ],
    },
    school_admin: {
      tag: 'ADMINISTRATIVE OVERVIEW',
      tone: 'Aggregated participation rates, domain coverage, and inclusive curriculum insights.',
      homeStrategies: [
        'Review cross-realm completion to ensure balanced literacy, numeracy, and fine-motor practice.',
        'Ensure evidence-based intervention resources are accessible to support classroom educators.',
        'Maintain strict student privacy and asset-based documentation standards across all records.',
      ],
    },
    student: {
      tag: 'EXPLORER SUPERPOWER HUB',
      tone: 'Fun, motivating celebration of your magical discoveries in Lumora World!',
      homeStrategies: [
        'You are an amazing Lumora Explorer! Every time you practice, your magical power grows stronger.',
        'Pick the next quest that looks most exciting to you and see what new realm secrets you unlock!',
        'Remember: making mistakes is how wizard brains learn magical new tricks!',
      ],
    },
  };

  const currentRoleInfo = roleGuidance[role] || roleGuidance.teacher;

  return (
    <section
      className="lumora-insight-panel"
      aria-labelledby="lumora-insight-heading"
      role="region"
    >
      {/* Header Bar */}
      <header className="lumora-insight-header">
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
                    ? `✨ Powered by ${insightResult.engine || 'Gemini 2.5 Flash'}`
                    : '🛡️ Offline Fallback (Non-AI)'}
                </span>
              )}
            </div>
            <p className="lumora-insight-subtitle">
              World-Aligned Learning Evidence & Support System · Strictly Non-Diagnostic
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
                <span>Synthesizing…</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">↻</span>
                <span>Regenerate Insights</span>
              </>
            )}
          </button>
        </div>
      </header>

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

      {/* Role Perspective Lens Banner */}
      <div className="lumora-role-lens-banner">
        <span className="lumora-lens-tag">{currentRoleInfo.tag}</span>
        <span className="lumora-lens-text">{currentRoleInfo.tone}</span>
      </div>

      {/* World Navigation Tabs */}
      <nav className="lumora-world-tabs" aria-label="Realm-specific analysis tabs">
        <button
          type="button"
          className={`lumora-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span aria-hidden="true">🌟</span>
          <span>All Realms Overview</span>
        </button>

        {WORLD_ORDER.map((wKey) => {
          const spec = WORLD_SPECS[wKey];
          const tel = learnerTelemetry[wKey];
          return (
            <button
              key={wKey}
              type="button"
              className={`lumora-tab-btn ${activeTab === wKey ? 'active' : ''}`}
              style={{
                borderColor: activeTab === wKey ? spec.color : undefined,
                color: activeTab === wKey ? spec.color : undefined,
              }}
              onClick={() => setActiveTab(wKey)}
            >
              <span aria-hidden="true">{spec.icon}</span>
              <span>{spec.name}</span>
              <span className="tab-count-pill">
                {tel?.completedCount || 0}/5
              </span>
            </button>
          );
        })}
      </nav>

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="lumora-loading-container" aria-live="polite">
          <div className="lumora-loading-pixel-box">
            <span className="lumora-loading-title">SYNTHESIZING REALM EVIDENCE WITH GEMINI</span>
            <p className="lumora-loading-sub">
              Analyzing accuracy, attempts, and multi-session persistence across Lumora’s 5 learning worlds…
            </p>
            <div className="lumora-loading-progress-bar">
              <div className="lumora-loading-progress-fill" />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INDIVIDUAL WORLD VIEW */}
      {activeTab !== 'all' && (
        <div className="lumora-world-detail-view">
          {(() => {
            const spec = WORLD_SPECS[activeTab];
            const tel = learnerTelemetry[activeTab];
            const aiInsight = worldInsights[activeTab];
            const hasData = tel && tel.completedCount > 0;
            const isSufficient = tel && tel.completedCount >= 2;

            return (
              <article className="lumora-realm-card" style={{ borderColor: spec.color }}>
                {/* Realm Header */}
                <div className="lumora-realm-header">
                  <div className="lumora-realm-title-group">
                    <span className="lumora-realm-big-icon" aria-hidden="true">
                      {spec.icon}
                    </span>
                    <div>
                      <div className="lumora-realm-title-row">
                        <h4 className="lumora-realm-heading" style={{ color: spec.color }}>
                          {spec.name}
                        </h4>
                        <span
                          className={`lumora-suff-badge ${tel.dataSufficiency}`}
                        >
                          {tel.dataSufficiency === 'sufficient'
                            ? `✅ Evidence-Ready (${tel.completedCount}/5 rounds)`
                            : tel.dataSufficiency === 'insufficient'
                            ? `⚠️ Preliminary (1 round recorded)`
                            : `⭕ No Activity Recorded`}
                        </span>
                      </div>
                      <p className="lumora-realm-constructs">
                        <strong>Educational Constructs: </strong> {spec.constructs}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insufficient Data Callout */}
                {tel.dataSufficiency === 'insufficient' && (
                  <div className="lumora-insufficient-banner" role="status">
                    <span className="insufficient-icon" aria-hidden="true">⚠️</span>
                    <div>
                      <strong>Preliminary Observation Only: </strong>
                      Only 1 challenge round has been logged in {spec.name}.
                      Lumora adheres to strict evidence standards and never establishes patterns or suggests difficulties based on a single round. Additional gameplay is needed.
                    </div>
                  </div>
                )}

                {/* Compact Summary Statistics & Donut */}
                <div className="lumora-stat-row">
                  <div className="lumora-stat-cell donut-cell">
                    <DonutChart
                      completed={tel.completedCount}
                      total={tel.totalCatalogCount}
                      color={spec.color}
                    />
                    <span className="donut-sub-label">Quests Completed</span>
                  </div>

                  <div className="lumora-stat-cell">
                    <span className="stat-label">Average Accuracy</span>
                    <span
                      className="stat-val highlight"
                      style={{ color: tel.avgAccuracy !== null ? spec.color : undefined }}
                    >
                      {tel.avgAccuracy !== null ? `${Math.round(tel.avgAccuracy * 100)}%` : '—'}
                    </span>
                    <span className="stat-sub">Across {tel.completedCount} challenge(s)</span>
                  </div>

                  <div className="lumora-stat-cell">
                    <span className="stat-label">Avg Attempts / Round</span>
                    <span className="stat-val">
                      {tel.avgAttempts !== null ? tel.avgAttempts.toFixed(1) : '—'}
                    </span>
                    <span className="stat-sub">
                      {tel.avgAttempts !== null && tel.avgAttempts > 1.8 ? 'Multi-attempt persistence' : 'Direct execution'}
                    </span>
                  </div>

                  <div className="lumora-stat-cell">
                    <span className="stat-label">Active Learning Time</span>
                    <span className="stat-val">{formatTime(tel.totalTimeMs)}</span>
                    <span className="stat-sub">In recorded {spec.name} quests</span>
                  </div>
                </div>

                {/* Visual Charts: Activity Bar Chart + Session Line Chart */}
                <div className="lumora-charts-grid">
                  <ActivityBarChart roundsData={tel.roundsWithMetrics} color={spec.color} />
                  <SessionLineChart sessionPoints={tel.sessionPoints} color={spec.color} />
                </div>

                {/* Gemini AI-Powered Interpretation Card */}
                {aiInsight && (
                  <div className="lumora-gemini-card">
                    <div className="lumora-gemini-header">
                      <div className="lumora-gemini-title">
                        <span aria-hidden="true">✨</span>
                        <h5>Gemini World Interpretation · {spec.name}</h5>
                      </div>
                      <span className="lumora-gemini-badge">Strengths-First</span>
                    </div>

                    <p className="lumora-gemini-summary">{aiInsight.summary}</p>

                    {/* Strengths & Support Areas Grid */}
                    <div className="lumora-two-col-grid">
                      {/* Strengths */}
                      <div className="lumora-grid-col strengths-col">
                        <div className="lumora-col-header">
                          <span className="lumora-col-icon" aria-hidden="true">⭐</span>
                          <h6 className="lumora-col-title">Observed Strengths in {spec.name}</h6>
                        </div>
                        {Array.isArray(aiInsight.strengths) && aiInsight.strengths.length > 0 ? (
                          <div className="lumora-card-stack">
                            {aiInsight.strengths.map((str, idx) => (
                              <div key={idx} className="lumora-feature-card strength">
                                <strong className="feature-title">{str.title}</strong>
                                <p className="lumora-card-desc">{str.description}</p>
                                {str.highlight && (
                                  <div className="lumora-card-highlight">
                                    <strong>Highlight: </strong> {str.highlight}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="lumora-empty-msg">Strengths will appear as rounds are completed.</p>
                        )}
                      </div>

                      {/* Support Areas */}
                      <div className="lumora-grid-col practice-col">
                        <div className="lumora-col-header">
                          <span className="lumora-col-icon" aria-hidden="true">🎯</span>
                          <h6 className="lumora-col-title">Areas Where Support May Help</h6>
                        </div>
                        {Array.isArray(aiInsight.supportAreas) && aiInsight.supportAreas.length > 0 ? (
                          <div className="lumora-card-stack">
                            {aiInsight.supportAreas.map((sup, idx) => (
                              <div key={idx} className="lumora-feature-card practice">
                                <strong className="feature-title">{sup.title}</strong>
                                <p className="lumora-card-desc">{sup.description}</p>
                                {sup.explanationOfEvidence && (
                                  <div className="lumora-rationale-box">
                                    <strong>Evidence context: </strong> {sup.explanationOfEvidence}
                                  </div>
                                )}
                                {sup.supportiveSuggestion && (
                                  <div className="lumora-suggestion-box">
                                    <strong>Educational strategy: </strong> {sup.supportiveSuggestion}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="lumora-empty-msg">No repeated difficulty patterns recorded in {spec.name}.</p>
                        )}
                      </div>
                    </div>

                    {/* Educational Recommendations & Next Activities */}
                    <div className="lumora-recs-row">
                      <div className="lumora-recs-box">
                        <h6>💡 Personalized Educational Recommendations</h6>
                        <ul>
                          {(aiInsight.practiceRecommendations || []).map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="lumora-recs-box">
                        <h6>🎮 Suggested Next Lumora Activities</h6>
                        <ul>
                          {(aiInsight.suggestedActivities || []).map((act, idx) => (
                            <li key={idx}>
                              <strong>{act}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Round Evidence Breakdown Table */}
                <div className="lumora-rounds-table-wrap">
                  <h5 className="lumora-table-heading">Authentic Activity Evidence ({spec.name}):</h5>
                  <div className="table-responsive">
                    <table className="lumora-evidence-table">
                      <thead>
                        <tr>
                          <th>Round Activity</th>
                          <th>Specific Construct Measured</th>
                          <th>Accuracy</th>
                          <th>Attempts</th>
                          <th>Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tel.roundsWithMetrics.map((r) => (
                          <tr key={r.round}>
                            <td>
                              <strong>Round {r.round}: {r.title}</strong>
                            </td>
                            <td className="table-construct-desc">{r.description}</td>
                            <td>
                              {r.played ? (
                                <span
                                  className="accuracy-pill"
                                  style={{
                                    borderColor: r.accuracy >= 0.8 ? spec.color : 'var(--amber)',
                                    color: r.accuracy >= 0.8 ? spec.color : 'var(--amber)',
                                  }}
                                >
                                  {Math.round(r.accuracy * 100)}%
                                </span>
                              ) : (
                                <span className="unattempted-text">Not played</span>
                              )}
                            </td>
                            <td>{r.played ? `${r.attempts} attempt(s)` : '—'}</td>
                            <td>{r.played ? formatTime(r.timeMs) : '—'}</td>
                            <td>
                              {r.played ? (
                                <span className="status-badge done">Completed</span>
                              ) : (
                                <span className="status-badge pending">Available Quest</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Role-Specific Perspective Box */}
                <div className="lumora-perspective-guidance-card">
                  <div className="guidance-header">
                    <span className="guidance-icon" aria-hidden="true">🧭</span>
                    <h6>{currentRoleInfo.tag} — Next Steps in {spec.name}</h6>
                  </div>
                  <ul className="guidance-list">
                    {currentRoleInfo.homeStrategies.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: ALL REALMS OVERVIEW */}
      {activeTab === 'all' && (
        <div className="lumora-all-realms-view">
          {/* Executive Summary Card */}
          {data?.summary && (
            <div className="lumora-summary-card">
              <div className="lumora-card-heading">
                <span className="lumora-card-icon" aria-hidden="true">🌟</span>
                <h4>Executive Learning Summary</h4>
              </div>
              <p className="lumora-summary-text">{data.summary}</p>
            </div>
          )}

          {/* 5-World Matrix Overview */}
          <div className="lumora-matrix-section">
            <h4 className="lumora-matrix-title">5 Learning Realms At-a-Glance</h4>
            <div className="lumora-matrix-grid">
              {WORLD_ORDER.map((wKey) => {
                const spec = WORLD_SPECS[wKey];
                const tel = learnerTelemetry[wKey];
                return (
                  <article
                    key={wKey}
                    className="lumora-matrix-card"
                    style={{ borderTop: `4px solid ${spec.color}` }}
                  >
                    <div className="matrix-card-header">
                      <span className="matrix-icon" aria-hidden="true">{spec.icon}</span>
                      <div>
                        <h5 className="matrix-name" style={{ color: spec.color }}>
                          {spec.name}
                        </h5>
                        <span className="matrix-focus">{spec.shortFocus}</span>
                      </div>
                    </div>

                    <div className="matrix-donut-row">
                      <DonutChart
                        completed={tel.completedCount}
                        total={tel.totalCatalogCount}
                        color={spec.color}
                        size={64}
                        stroke={6}
                      />
                      <div className="matrix-stats-col">
                        <div className="matrix-stat-item">
                          <span className="stat-k">Accuracy:</span>
                          <span className="stat-v" style={{ color: spec.color }}>
                            {tel.avgAccuracy !== null ? `${Math.round(tel.avgAccuracy * 100)}%` : '—'}
                          </span>
                        </div>
                        <div className="matrix-stat-item">
                          <span className="stat-k">Time:</span>
                          <span className="stat-v">{formatTime(tel.totalTimeMs)}</span>
                        </div>
                        <div className="matrix-stat-item">
                          <span className="stat-k">Status:</span>
                          <span className={`status-pill ${tel.dataSufficiency}`}>
                            {tel.dataSufficiency === 'sufficient' ? 'Ready' : tel.dataSufficiency === 'insufficient' ? '1 Round' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="lumora-matrix-drilldown-btn"
                      style={{ borderColor: spec.color, color: spec.color }}
                      onClick={() => setActiveTab(wKey)}
                    >
                      View {spec.name} Report →
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Global Strengths & Support Areas */}
          {data && (
            <div className="lumora-two-col-grid">
              {/* Strengths */}
              <div className="lumora-grid-col strengths-col">
                <div className="lumora-col-header">
                  <span className="lumora-col-icon" aria-hidden="true">⭐</span>
                  <h4 className="lumora-col-title">Top Observed Strengths</h4>
                </div>
                {Array.isArray(data.strengths) && data.strengths.length > 0 ? (
                  <div className="lumora-card-stack">
                    {data.strengths.map((item, idx) => {
                      const spec = WORLD_SPECS[item.world] || { name: item.world, icon: '✨', color: 'var(--cyan)' };
                      return (
                        <div key={idx} className="lumora-feature-card strength">
                          <div className="lumora-card-top">
                            <span className="lumora-world-tag" style={{ borderColor: spec.color, color: spec.color }}>
                              <span aria-hidden="true">{spec.icon}</span> {spec.name}
                            </span>
                            <span className="lumora-domain-pill">{item.domain}</span>
                          </div>
                          <p className="lumora-card-desc">{item.description}</p>
                          {item.highlight && (
                            <div className="lumora-card-highlight">
                              <strong>Highlight: </strong> {item.highlight}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="lumora-empty-msg">Strengths will appear as rounds are completed.</p>
                )}
              </div>

              {/* Practice Areas */}
              <div className="lumora-grid-col practice-col">
                <div className="lumora-col-header">
                  <span className="lumora-col-icon" aria-hidden="true">🎯</span>
                  <h4 className="lumora-col-title">Areas Where Support May Help</h4>
                </div>
                {Array.isArray(data.practiceAreas) && data.practiceAreas.length > 0 ? (
                  <div className="lumora-card-stack">
                    {data.practiceAreas.map((item, idx) => {
                      const spec = WORLD_SPECS[item.world] || { name: item.world, icon: '🎯', color: 'var(--amber)' };
                      return (
                        <div key={idx} className="lumora-feature-card practice">
                          <div className="lumora-card-top">
                            <span className="lumora-world-tag" style={{ borderColor: spec.color, color: spec.color }}>
                              <span aria-hidden="true">{spec.icon}</span> {spec.name}
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
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="lumora-empty-msg">No repeated challenges recorded across realms.</p>
                )}
              </div>
            </div>
          )}

          {/* Progress Observations across sessions */}
          {Array.isArray(data?.progressObservations) && data.progressObservations.length > 0 && (
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
                    <div key={idx} className={`lumora-obs-chip trend-${trend}`}>
                      <span className="lumora-trend-tag">{trendLabel}</span>
                      <p className="lumora-trend-text">{obs.observation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role Perspective Box */}
          <div className="lumora-perspective-guidance-card">
            <div className="guidance-header">
              <span className="guidance-icon" aria-hidden="true">🧭</span>
              <h6>{currentRoleInfo.tag} — Holistic Learning Recommendations</h6>
            </div>
            <ul className="guidance-list">
              {currentRoleInfo.homeStrategies.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ethical AI & Privacy Footnote */}
      <footer className="lumora-panel-footer">
        <div className="lumora-footer-badges">
          <span className="lumora-footer-pill">🔒 Zero PII Transmitted</span>
          <span className="lumora-footer-pill">📊 Grounded in Recorded Gameplay Only</span>
          <span className="lumora-footer-pill">🛡️ Strictly Non-Diagnostic</span>
          <span className="lumora-footer-pill">💖 Strengths-First Design</span>
        </div>
        <p className="lumora-footer-disclaimer">
          Lumora Insight provides formative educational support to empower collaborative conversations between families,
          teachers, and specialists. Gameplay telemetry never diagnoses dyslexia, dysgraphia, dyscalculia, ADHD, or any medical condition.
        </p>
      </footer>
    </section>
  );
}
