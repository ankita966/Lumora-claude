import React, { useMemo, useState } from 'react';
import { WORLD_ORDER, WORLDS } from '../data/worlds';
import LumoraInsightPanel from './LumoraInsightPanel';
import './learningInsights.css';

/**
 * Activity & round catalog across all 5 Lumora learning worlds.
 * Maps every round to the specific cognitive/learning domain it actually exercises.
 */
export const WORLD_ROUNDS = {
  soundForest: [
    { round: 1, title: 'Slash Quest', domain: 'phonological', description: 'Initial phoneme isolation & auditory target discrimination (/r/ vs distractors)', skill: 'sound' },
    { round: 2, title: 'Sound Match', domain: 'phonological', description: 'Letter-sound correspondence & auditory phoneme matching', skill: 'sound' },
    { round: 3, title: 'Phoneme Blend', domain: 'phonological', description: 'Auditory synthesis blending segmented phonemes into whole words', skill: 'sound' },
    { round: 4, title: 'Pronounce It', domain: 'phonological', description: 'Oral speech recognition, pronunciation clarity & verbal articulation', skill: 'sound' },
    { round: 5, title: 'Word Recognition', domain: 'phonological', description: 'Auditory-to-visual word recognition and phonological retrieval', skill: 'sound' },
  ],
  storyCastle: [
    { round: 1, title: 'Magic Words', domain: 'reading', description: 'Sight word identification and rapid orthographic recognition', skill: 'reading' },
    { round: 2, title: 'Missing Word', domain: 'reading', description: 'Sentence-level cloze decoding and contextual semantic integration', skill: 'reading' },
    { round: 3, title: 'Read Aloud', domain: 'reading', description: 'Connected passage oral reading fluency with speech recognition', skill: 'reading' },
    { round: 4, title: 'Story Path', domain: 'reading', description: 'Narrative comprehension, story sequencing and inference making', skill: 'reading' },
    { round: 5, title: 'Story Question', domain: 'reading', description: 'Reading comprehension recall and textual detail retention', skill: 'reading' },
  ],
  runeRealm: [
    { round: 1, title: 'Magic Circle', domain: 'writing_motor', description: 'Continuous curved trajectory tracing & fine motor stroke completion', skill: 'motor' },
    { round: 2, title: 'Magic Letter (A)', domain: 'writing_motor', description: 'Letter formation, stroke directionality & pre-writing motor coordination (Letter A)', skill: 'motor' },
    { round: 3, title: 'Magic Number (3)', domain: 'math_number', description: 'Number formation, arc reversal & digit stroke control (Digit 3)', skill: 'motor' },
    { round: 4, title: 'Magic Star', domain: 'writing_motor', description: 'Angular stroke redirection & multi-point waypoint precision', skill: 'motor' },
    { round: 5, title: 'Ancient Rune', domain: 'writing_motor', description: 'Complex motor planning, multi-stroke sequencing & sustained motor focus', skill: 'motor' },
  ],
  memoryMountains: [
    { round: 1, title: 'Remember Objects', domain: 'memory', description: 'Visual short-term working memory & item recognition', skill: 'memory' },
    { round: 2, title: "What's Missing?", domain: 'memory', description: 'Visual working memory updating, comparison & change detection', skill: 'memory' },
    { round: 3, title: 'Remember the Order', domain: 'memory', description: 'Sequential working memory & serial order recall', skill: 'memory' },
    { round: 4, title: 'Follow the Pattern', domain: 'math_number', description: 'Sequential pattern logic, relational reasoning & mathematical pattern matching', skill: 'numberSense' },
    { round: 5, title: 'Memory Master Challenge', domain: 'memory', description: 'High-load multi-item sequential working memory with distractors', skill: 'memory' },
  ],
  visionValley: [
    { round: 1, title: 'Follow', domain: 'vision', description: 'Smooth pursuit visual tracking across continuous celestial trajectories', skill: 'vision' },
    { round: 2, title: 'Catch', domain: 'vision', description: 'Rapid visual saccades & target acquisition reaction speed', skill: 'vision' },
    { round: 3, title: 'Select', domain: 'vision', description: 'Visual discrimination, color/shape matching & feature search', skill: 'vision' },
    { round: 4, title: 'Slash', domain: 'vision', description: 'Visual-motor timing, dynamic movement interception & hand-eye coordination', skill: 'vision' },
    { round: 5, title: 'Mixed Magic', domain: 'vision', description: 'Integrated visual-spatial processing and adaptive multi-target response', skill: 'vision' },
  ],
};

/**
 * Educational domains measured by Lumora World.
 * Strictly limited to domains with authentic in-game mechanics.
 */
export const LEARNING_DOMAINS = {
  phonological: {
    key: 'phonological',
    title: 'Phonological Awareness & Letter-Sound Recognition',
    icon: '🌲',
    worldKey: 'soundForest',
    worldName: 'Sound Forest',
    color: '#38B6FF',
    conditionKey: 'dyslexia',
    description: 'Measures letter-sound associations, phoneme blending, auditory discrimination, and spoken pronunciation.',
  },
  reading: {
    key: 'reading',
    title: 'Reading Fluency & Text Comprehension',
    icon: '🏰',
    worldKey: 'storyCastle',
    worldName: 'Story Castle',
    color: '#E5A83B',
    conditionKey: 'dyslexia',
    description: 'Measures sight word recognition, sentence-level cloze decoding, oral passage fluency, and narrative recall.',
  },
  writing_motor: {
    key: 'writing_motor',
    title: 'Letter Formation & Fine Motor Coordination (Writing)',
    icon: '✍️',
    worldKey: 'runeRealm',
    worldName: 'Rune Realm',
    color: '#FF2E93',
    conditionKey: 'dysgraphia',
    description: 'Measures letter tracing (Letter A), waypoint precision, continuous stroke planning, and motor trajectory control.',
  },
  math_number: {
    key: 'math_number',
    title: 'Number Recognition & Mathematical Pattern Reasoning',
    icon: '🔢',
    worldKey: 'memoryMountains',
    worldName: 'Memory Mountains & Rune Realm',
    color: '#48B8D0',
    conditionKey: 'dyscalculia',
    description: 'Measures number formation (Digit 3), sequential pattern logic, and relational mathematical reasoning.',
  },
  memory: {
    key: 'memory',
    title: 'Visual Working Memory & Sequential Recall',
    icon: '🧠',
    worldKey: 'memoryMountains',
    worldName: 'Memory Mountains',
    color: '#A47BE0',
    conditionKey: null,
    description: 'Measures short-term object recall, visual working memory updating, and serial order sequencing.',
  },
  vision: {
    key: 'vision',
    title: 'Visual Tracking & Saccadic Discrimination',
    icon: '👁️',
    worldKey: 'visionValley',
    worldName: 'Vision Valley',
    color: '#48B8D0',
    conditionKey: null,
    description: 'Measures smooth pursuit tracking, saccadic target acquisition, visual discrimination, and visual-motor timing.',
  },
};

/**
 * Educational information on learning differences.
 * Presented responsibly, explicitly non-diagnostic, strictly educational.
 */
export const LEARNING_DIFFERENCES_INFO = {
  dyslexia: {
    name: 'Dyslexia',
    subtitle: 'Reading & language-processing difference',
    relevantDomains: ['phonological', 'reading'],
    worldConnection: 'Sound Forest & Story Castle',
    definition: 'A natural learning difference in phonological processing, word reading accuracy, and decoding fluency.',
    notIntelligence: 'Unrelated to intelligence. Individuals often excel in spatial reasoning, big-picture thinking, and creative storytelling.',
    gameplayDistinction: 'Microphone volume, speech pace, and device familiarity influence scores. Low in-game scores are NOT diagnostic of dyslexia.',
    classroomSuggestions: [
      'Provide structured, multi-sensory phonics and extra time for reading.',
      'Offer text-to-speech tools and graphic organizers to access grade-level content.',
    ],
    homeSuggestions: [
      'Practice 10–15 min shared reading daily and play fun oral rhyming games.',
      'Celebrate reading effort and stamina rather than reading speed.',
    ],
    studentMessage: 'Exploring stories with Phono and Luna helps your reading muscles grow stronger every day!',
  },
  dysgraphia: {
    name: 'Dysgraphia',
    subtitle: 'Written expression & motor coordination difference',
    relevantDomains: ['writing_motor'],
    worldConnection: 'Rune Realm',
    definition: 'A learning difference affecting handwriting mechanics, stroke consistency, spacing, and fine-motor planning.',
    notIntelligence: 'No link to intelligence. Students often possess rich vocabularies and verbal conceptual skills exceeding their handwriting neatness.',
    gameplayDistinction: 'Hand-tracking camera sensitivity, lighting, and finger fatigue affect tracing. Tracing difficulty is NOT diagnostic of dysgraphia.',
    classroomSuggestions: [
      'Allow speech-to-text, keyboarding, or oral responses as alternatives.',
      'Provide ergonomic pencil grips and grade intellectual ideas separately from handwriting neatness.',
    ],
    homeSuggestions: [
      'Play fine-motor games (clay modeling, bead threading, mazes).',
      'Practice large letter shapes in sensory trays (sand/salt) without pressure.',
    ],
    studentMessage: 'Drawing runes takes patience! Move at whatever speed feels comfortable to awaken each glowing star.',
  },
  dyscalculia: {
    name: 'Dyscalculia',
    subtitle: 'Number sense & mathematical reasoning difference',
    relevantDomains: ['math_number'],
    worldConnection: 'Memory Mountains & Rune Realm',
    definition: 'A learning difference affecting intuitive number sense, math fact recall, and sequential calculations.',
    notIntelligence: 'Independent of intelligence. Learners often show outstanding strengths in verbal arts, visual design, and intuitive empathy.',
    gameplayDistinction: 'Pattern games test working memory, visual attention, and timing. Multi-attempt pattern solving does NOT indicate dyscalculia.',
    classroomSuggestions: [
      'Use concrete manipulatives (counters, ten-frames) and visual number lines.',
      'Break multi-step math into single sequential steps with visual checklists.',
    ],
    homeSuggestions: [
      'Play dice, dominoes, and board games involving counting and patterns.',
      'Connect numbers to everyday real-life activities (cooking, measuring).',
    ],
    studentMessage: 'Numbers are like secret puzzles! Every pattern you solve helps you unlock hidden mountain secrets.',
  },
};

/**
 * Sample learners list (retained empty for compatibility).
 * Authenticated and connected learner data is used exclusively.
 */
export const SAMPLE_LEARNERS = [];

function dateLabel(timestamp, options = { dateStyle: 'medium' }) {
  if (!Number.isFinite(timestamp)) return 'Date not recorded';
  return new Intl.DateTimeFormat(undefined, options).format(new Date(timestamp));
}

function dateTimeLabel(timestamp) {
  if (!Number.isFinite(timestamp)) return 'Date not recorded';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp));
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 'not recorded';
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

/**
 * Maps an activity entry to its measured domain using round-level precision.
 */
function getDomainForActivity(entry) {
  const worldRounds = WORLD_ROUNDS[entry.world];
  if (worldRounds) {
    const roundDef = worldRounds.find((r) => r.round === entry.round);
    if (roundDef?.domain) return roundDef.domain;
  }
  // Fallback to skill mapping
  if (entry.skill === 'sound') return 'phonological';
  if (entry.skill === 'reading') return 'reading';
  if (entry.skill === 'motor') return 'writing_motor';
  if (entry.skill === 'numberSense') return 'math_number';
  if (entry.skill === 'memory') return 'memory';
  if (entry.skill === 'vision') return 'vision';
  return null;
}

/**
 * Analyzes activity log evidence strictly by measured domain.
 * Distinguishes recorded difficulties from insufficient data.
 */
function analyzeDomainEvidence(activityLog) {
  const validEntries = activityLog.filter((item) => Number.isFinite(item.accuracy) && Number.isFinite(item.ts));
  const domainGroups = new Map();

  for (const domainKey of Object.keys(LEARNING_DOMAINS)) {
    domainGroups.set(domainKey, []);
  }

  for (const entry of validEntries) {
    const domainKey = getDomainForActivity(entry);
    if (domainKey && domainGroups.has(domainKey)) {
      domainGroups.get(domainKey).push(entry);
    }
  }

  return Object.keys(LEARNING_DOMAINS).map((domainKey) => {
    const domainMeta = LEARNING_DOMAINS[domainKey];
    const entries = domainGroups.get(domainKey) || [];
    const count = entries.length;

    if (count === 0) {
      return {
        ...domainMeta,
        entries: [],
        count: 0,
        status: 'no_data',
        statusLabel: 'No activity recorded yet',
        avgAccuracy: null,
        avgAttempts: null,
        totalTimeMs: 0,
        sessionsCount: 0,
        strengths: [],
        growthAreas: [],
        roundBreakdown: [],
      };
    }

    const totalAcc = entries.reduce((sum, e) => sum + e.accuracy, 0);
    const avgAccuracy = totalAcc / count;
    const totalAttempts = entries.reduce((sum, e) => sum + (Number.isFinite(e.attempts) ? e.attempts : 1), 0);
    const avgAttempts = totalAttempts / count;
    const totalTimeMs = entries.reduce((sum, e) => sum + (Number.isFinite(e.timeMs) ? e.timeMs : 0), 0);
    const sessions = new Set(entries.map((e) => e.sessionId).filter(Boolean));
    const dates = entries.map((e) => e.ts).sort((a, b) => a - b);

    // Group by specific round to show concrete round-level evidence
    const byRound = new Map();
    for (const e of entries) {
      const key = `${e.world}-r${e.round}`;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key).push(e);
    }

    const roundBreakdown = [...byRound.entries()].map(([key, items]) => {
      const representativeItem = items[0];
      const worldDef = WORLD_ROUNDS[representativeItem.world]?.find((r) => r.round === representativeItem.round);
      const rAvgAcc = items.reduce((s, i) => s + i.accuracy, 0) / items.length;
      const rTotalAttempts = items.reduce((s, i) => s + (i.attempts || 1), 0);
      return {
        key,
        worldKey: representativeItem.world,
        worldName: WORLDS[representativeItem.world]?.name ?? representativeItem.world,
        round: representativeItem.round,
        title: worldDef?.title || `Round ${representativeItem.round}`,
        description: worldDef?.description || '',
        count: items.length,
        avgAccuracy: rAvgAcc,
        totalAttempts: rTotalAttempts,
        avgAttempts: rTotalAttempts / items.length,
        lastPracticed: Math.max(...items.map((i) => i.ts)),
      };
    });

    // Evidence sufficiency threshold: at least 2 completed rounds are required to establish a pattern
    let status = 'insufficient';
    let statusLabel = 'Insufficient data (1 round recorded)';
    if (count >= 3 && (sessions.size >= 2 || dates[dates.length - 1] - dates[0] > 1800000)) {
      status = 'established';
      statusLabel = `Pattern established across ${count} rounds and ${sessions.size || 1} session(s)`;
    } else if (count >= 2) {
      status = 'developing';
      statusLabel = `Early observation across ${count} rounds`;
    }

    // Strengths: repeated evidence of high accuracy (>= 80%) with minimal attempts
    const strengths = roundBreakdown.filter((r) => r.avgAccuracy >= 0.8 && r.avgAttempts <= 1.5);

    // Areas for practice / growth: repeated attempts (>= 2) or accuracy < 65%
    const growthAreas = roundBreakdown.filter((r) => r.avgAccuracy < 0.68 || r.avgAttempts >= 2.0);

    return {
      ...domainMeta,
      entries,
      count,
      status,
      statusLabel,
      avgAccuracy,
      avgAttempts,
      totalTimeMs,
      sessionsCount: sessions.size,
      firstPracticed: dates[0],
      lastPracticed: dates[dates.length - 1],
      strengths,
      growthAreas,
      roundBreakdown,
    };
  });
}

function progressSeries(activityLog) {
  const groups = new Map();
  activityLog.filter((item) => item.sessionId && Number.isFinite(item.accuracy)).forEach((item) => {
    const key = `${item.world}:${item.round}:${item.skill}`;
    if (!groups.has(key)) groups.set(key, new Map());
    const sessions = groups.get(key);
    if (!sessions.has(item.sessionId)) sessions.set(item.sessionId, []);
    sessions.get(item.sessionId).push(item);
  });
  return [...groups.entries()].map(([key, sessions]) => ({
    key,
    points: [...sessions.values()]
      .map((items) => ({
        timestamp: Math.min(...items.map((item) => item.ts)),
        accuracy: items.reduce((sum, item) => sum + item.accuracy, 0) / items.length,
      }))
      .sort((a, b) => a.timestamp - b.timestamp),
  })).filter((series) => series.points.length > 1).slice(0, 5);
}

function ProgressChart({ series }) {
  if (!series.length) {
    return (
      <div className="insights-chart-empty">
        <p className="insights-muted">Comparable results from multiple recorded sessions will appear here as the student continues their quests.</p>
        <span className="insights-chart-empty-sub">Lumora reports only authentic recorded gameplay history — unmeasured past sessions are never estimated.</span>
      </div>
    );
  }
  const width = 560;
  const height = 180;
  const colors = ['#38B6FF', '#48B8D0', '#E5A83B', '#A47BE0', '#FF2E93'];

  return (
    <div className="insights-chart-container">
      <svg className="insights-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Learning accuracy progress over multiple recorded sessions">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = height - 24 - value * (height - 48);
          return (
            <g key={value}>
              <line x1="42" x2={width - 12} y1={y} y2={y} stroke="rgba(184, 226, 250, 0.15)" strokeDasharray="3 4" />
              <text x="4" y={y + 4} fill="var(--text-low)" fontSize="11" fontFamily="var(--font-body)">
                {Math.round(value * 100)}%
              </text>
            </g>
          );
        })}
        {series.map((line, index) => {
          const color = colors[index % colors.length];
          const pts = line.points.map((point, pointIndex) => {
            const x = 52 + (pointIndex / (line.points.length - 1)) * (width - 76);
            const y = height - 24 - point.accuracy * (height - 48);
            return `${x},${y}`;
          });
          return (
            <g key={line.key}>
              <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {line.points.map((point, pointIndex) => {
                const [cx, cy] = pts[pointIndex].split(',').map(Number);
                return (
                  <circle key={`${line.key}-${point.timestamp}`} cx={cx} cy={cy} r="4.5" fill={color} stroke="var(--bg-space)" strokeWidth="1.5">
                    <title>{dateLabel(point.timestamp)}: {Math.round(point.accuracy * 100)}%</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
      <ul className="insights-series-list">
        {series.map((line, index) => {
          const [worldKey, roundNum] = line.key.split(':');
          const worldName = WORLDS[worldKey]?.name ?? worldKey;
          const roundDef = WORLD_ROUNDS[worldKey]?.find((r) => r.round === Number(roundNum));
          return (
            <li key={line.key}>
              <span className="series-swatch" style={{ background: colors[index % colors.length] }} aria-hidden="true" />
              <strong>{worldName} — Round {roundNum} ({roundDef?.title || 'Activity'})</strong>: {line.points.map((point) => `${dateLabel(point.timestamp)}: ${Math.round(point.accuracy * 100)}%`).join(' → ')}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LearningInsightsEntryPoint({ learner, onOpen, label = 'Learning Insights & Support Report' }) {
  const openReport = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    const report = document.getElementById('learning-insights-report');
    if (!report) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    report.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="insights-entry">
      <button type="button" className="ref-action-btn-primary" onClick={openReport} disabled={!learner}>
        📊 {label}
      </button>
      <span className="insights-entry-hint">
        {learner ? `View evidence-based observations for ${learner.displayName}.` : 'Select a student to view their Learning Insights & Support Report.'}
      </span>
    </div>
  );
}

export default function LearningInsightsReport({
  learner,
  role = 'teacher',
  onRefresh,
  refreshing = false,
}) {
  const [selectedWorld, setSelectedWorld] = useState('all');
  const [activePerspective, setActivePerspective] = useState(role);

  if (!learner) {
    return (
      <section id="learning-insights-report" className="panel-card learning-insights" aria-labelledby="learning-insights-empty-title">
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
          <h2 id="learning-insights-empty-title" style={{ fontSize: 18, color: 'var(--text-hi)', margin: '0 0 10px', fontWeight: 800 }}>
            No learners linked yet. Generate or enter a student linking code to connect a learner.
          </h2>
        </div>
      </section>
    );
  }

  const effectiveLearner = learner;

  const allActivity = effectiveLearner?.activityLog ?? [];
  const activityLog = useMemo(
    () => (selectedWorld === 'all' ? allActivity : allActivity.filter((item) => item.world === selectedWorld)),
    [allActivity, selectedWorld]
  );

  const allSessions = effectiveLearner?.sessionLog ?? [];
  const sessionLog = useMemo(
    () => (selectedWorld === 'all' ? allSessions : allSessions.filter((item) => item.world === selectedWorld)),
    [allSessions, selectedWorld]
  );

  // Analyze all domains
  const domainSummaries = useMemo(() => analyzeDomainEvidence(activityLog), [activityLog]);

  // Measured domains: domains that have at least 1 recorded round in the student's history
  const measuredDomains = useMemo(() => domainSummaries.filter((d) => d.count > 0), [domainSummaries]);

  // Domains with sufficient data (>= 2 rounds)
  const establishedDomains = useMemo(() => domainSummaries.filter((d) => d.count >= 2), [domainSummaries]);

  // Strengths & Growth Areas across measured domains
  const overallStrengths = useMemo(() => domainSummaries.flatMap((d) => d.strengths), [domainSummaries]);
  const overallGrowthAreas = useMemo(() => domainSummaries.flatMap((d) => d.growthAreas), [domainSummaries]);

  // Group growth areas by realm to eliminate repetitive cards and keep report concise
  const growthAreasByRealm = useMemo(() => {
    const realmMap = new Map();
    for (const item of overallGrowthAreas) {
      if (!realmMap.has(item.worldKey)) {
        realmMap.set(item.worldKey, {
          worldKey: item.worldKey,
          worldName: item.worldName,
          items: [],
        });
      }
      realmMap.get(item.worldKey).items.push(item);
    }
    return [...realmMap.values()];
  }, [overallGrowthAreas]);

  // Relevant learning differences: ONLY conditions whose measured domains have recorded activity!
  const relevantConditions = useMemo(() => {
    const measuredKeys = new Set(measuredDomains.map((d) => d.key));
    const conditions = [];

    if (measuredKeys.has('phonological') || measuredKeys.has('reading')) {
      conditions.push({ key: 'dyslexia', ...LEARNING_DIFFERENCES_INFO.dyslexia });
    }
    if (measuredKeys.has('writing_motor')) {
      conditions.push({ key: 'dysgraphia', ...LEARNING_DIFFERENCES_INFO.dysgraphia });
    }
    if (measuredKeys.has('math_number')) {
      conditions.push({ key: 'dyscalculia', ...LEARNING_DIFFERENCES_INFO.dyscalculia });
    }
    return conditions;
  }, [measuredDomains]);

  const series = useMemo(() => progressSeries(activityLog), [activityLog]);

  const sessionsWithDates = sessionLog.filter((s) => Number.isFinite(s.startedAt));
  const completedSessions = sessionsWithDates.filter((s) => Number.isFinite(s.completedAt)).length;
  const allTimestamps = [...activityLog.map((i) => i.ts), ...sessionsWithDates.map((s) => s.startedAt)].filter(Number.isFinite);
  const startDate = allTimestamps.length ? Math.min(...allTimestamps) : null;
  const endDate = allTimestamps.length ? Math.max(...allTimestamps) : null;

  const completedWorlds = WORLD_ORDER.filter(
    (key) => effectiveLearner?.worldsCompleted?.[key] && (selectedWorld === 'all' || key === selectedWorld)
  );
  const worldsWithActivity = [...new Set(activityLog.map((i) => i.world))];
  const totalRoundsLogged = activityLog.length;
  const recordedTime = activityLog.reduce((sum, item) => sum + (Number.isFinite(item.timeMs) ? item.timeMs : 0), 0);
  const totalAttemptsCount = activityLog.reduce((sum, item) => sum + (Number.isFinite(item.attempts) ? item.attempts : 1), 0);

  return (
    <section id="learning-insights-report" className="panel-card learning-insights" aria-labelledby="learning-insights-title">
      {/* Main Header */}
      <header className="insights-heading">
        <div className="insights-header-main">
          <div className="insights-title-row">
            <span className="insights-icon" aria-hidden="true">📜</span>
            <div>
              <h2 id="learning-insights-title" className="insights-main-title">Learning Insights & Support Report</h2>
              <p className="insights-subtitle">
                <strong>{effectiveLearner?.displayName || 'Learner'}</strong> · Generated {dateLabel(Date.now())} · {effectiveLearner?.grade || 'Elementary'}
              </p>
            </div>
          </div>
        </div>

        <div className="insights-actions">
          {onRefresh && (
            <button type="button" className="insights-button" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : '↻ Refresh data'}
            </button>
          )}
          <button type="button" className="insights-button insights-button-print" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </header>

      {/* Strict Non-Diagnostic Notice */}
      <div className="insights-legal-banner" role="note" aria-label="Non-diagnostic disclosure">
        <div className="insights-legal-icon" aria-hidden="true">🛡️</div>
        <div className="insights-legal-content">
          <strong>Supportive Learning Tool · Strictly Non-Diagnostic</strong>
          <p>
            Lumora World is an educational game designed to foster joyful practice and illuminate observable learning patterns.
            It is <strong>not a medical or psychological diagnostic tool</strong>. Under no circumstances does gameplay establish or rule out dyslexia, dysgraphia, dyscalculia, ADHD, or any other learning or medical condition.
            Learning differences are <strong>not measures of intelligence</strong>. For formal educational evaluations, please consult with your student’s school team and a licensed professional.
          </p>
        </div>
      </div>

      {/* Role Perspective Selector & World Filter */}
      <div className="insights-controls-bar">
        <div className="insights-control-group">
          <span className="insights-control-label">Perspective view:</span>
          <div className="insights-perspective-pills" role="tablist" aria-label="Perspective View">
            {[
              { id: 'teacher', label: '🏫 Teacher' },
              { id: 'parent', label: '👪 Parent' },
              { id: 'specialist', label: '🔬 Specialist' },
              { id: 'school_admin', label: '🏛️ School Admin' },
              { id: 'student', label: '⭐ Student' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activePerspective === p.id}
                className={`insights-pill-btn ${activePerspective === p.id ? 'active' : ''}`}
                onClick={() => setActivePerspective(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="insights-control-group">
          <label htmlFor="insights-world-filter" className="insights-control-label">Filter realm:</label>
          <select
            id="insights-world-filter"
            className="insights-select"
            value={selectedWorld}
            onChange={(e) => setSelectedWorld(e.target.value)}
          >
            <option value="all">All 5 Magical Realms</option>
            {WORLD_ORDER.map((worldKey) => (
              <option key={worldKey} value={worldKey}>
                {WORLDS[worldKey]?.name} ({WORLDS[worldKey]?.focus.split('·')[0].trim()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✨ LUMORA INSIGHT: Gemini-Powered Learning Insights */}
      <LumoraInsightPanel
        learner={effectiveLearner}
        role={activePerspective}
        selectedWorld={selectedWorld}
      />

      {/* Section 1: Executive Overview & Evidence Metrics */}
      <section className="insights-section" aria-labelledby="heading-overview">
        <div className="insights-section-header">
          <h3 id="heading-overview">1. Recorded Learning Activity Overview</h3>
          <span className="insights-badge-neutral">{selectedWorld === 'all' ? 'All Realms Active' : WORLDS[selectedWorld]?.name}</span>
        </div>

        <div className="insights-stat-grid">
          <div className="insights-stat-card">
            <span className="insights-stat-label">Sessions Started / Done</span>
            <span className="insights-stat-value">{sessionsWithDates.length} / {completedSessions}</span>
            <span className="insights-stat-sub">{startDate ? `${dateLabel(startDate)} – ${dateLabel(endDate)}` : 'Dates pending'}</span>
          </div>
          <div className="insights-stat-card">
            <span className="insights-stat-label">Realms Explored</span>
            <span className="insights-stat-value">{worldsWithActivity.length}/5</span>
            <span className="insights-stat-sub">{completedWorlds.length} realm{completedWorlds.length === 1 ? '' : 's'} mastered</span>
          </div>
          <div className="insights-stat-card">
            <span className="insights-stat-label">Rounds Completed</span>
            <span className="insights-stat-value">{totalRoundsLogged}</span>
            <span className="insights-stat-sub">{totalAttemptsCount} total in-game attempts logged</span>
          </div>
          <div className="insights-stat-card">
            <span className="insights-stat-label">Active Learning Time</span>
            <span className="insights-stat-value">{formatDuration(recordedTime)}</span>
            <span className="insights-stat-sub">Across recorded activities</span>
          </div>
        </div>

        <div className="insights-evidence-status-box">
          <span className="insights-status-indicator" aria-hidden="true">ℹ️</span>
          <div>
            <strong>Evidence Status: </strong>
            {establishedDomains.length >= 3 ? (
              <span>History includes comparable, multi-session evidence across {establishedDomains.length} measured learning domains.</span>
            ) : establishedDomains.length >= 1 ? (
              <span>Initial patterns established for {establishedDomains.map((d) => d.title.split('&')[0]).join(', ')}. Additional sessions will enrich comparisons.</span>
            ) : (
              <span>Preliminary exploratory activity. At least 2 completed rounds per domain are needed before consistent patterns can be described.</span>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Learning-Domain Summaries (Actual Measured Domains ONLY) */}
      <section className="insights-section" aria-labelledby="heading-domains">
        <div className="insights-section-header">
          <h3 id="heading-domains">2. Learning-Domain Evidence Summaries</h3>
          <span className="insights-badge-info">Analyzed from Actual Recorded Activities Only</span>
        </div>
        <p className="insights-domain-intro">
          Lumora reports learning patterns <strong>strictly for domains measured by existing gameplay</strong>. Unmeasured skills are not inferred.
          Below is the evidence breakdown for each measured domain, distinguishing actual recorded patterns from insufficient exploratory data.
        </p>

        <div className="insights-domain-cards-list">
          {domainSummaries.map((domain) => {
            const hasData = domain.count > 0;
            const isInsufficient = domain.status === 'insufficient';
            const isEstablished = domain.status === 'established';

            return (
              <article key={domain.key} className={`insights-domain-card ${hasData ? 'active' : 'empty'}`}>
                <div className="insights-domain-header" style={{ borderLeftColor: domain.color }}>
                  <div className="insights-domain-title-wrap">
                    <span className="insights-domain-icon" aria-hidden="true">{domain.icon}</span>
                    <div>
                      <h4 className="insights-domain-title">{domain.title}</h4>
                      <span className="insights-domain-world-tag">
                        Realm: <strong>{domain.worldName}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="insights-domain-badge-wrap">
                    {hasData ? (
                      <span className={`insights-status-tag ${domain.status}`}>
                        {isEstablished ? '✓ Pattern Established' : isInsufficient ? '⚠️ Insufficient Data' : '● Early Observation'}
                      </span>
                    ) : (
                      <span className="insights-status-tag none">No recorded rounds</span>
                    )}
                  </div>
                </div>

                <div className="insights-domain-body">
                  <p className="insights-domain-desc">{domain.description}</p>

                  {hasData ? (
                    <>
                      {/* Metric summary pills */}
                      <div className="insights-metric-pills">
                        <div className="insights-metric-pill">
                          <span className="pill-lbl">Completed Rounds:</span>
                          <span className="pill-val">{domain.count}</span>
                        </div>
                        <div className="insights-metric-pill">
                          <span className="pill-lbl">Average Accuracy:</span>
                          <span className="pill-val highlight" style={{ color: domain.color }}>
                            {Math.round(domain.avgAccuracy * 100)}%
                          </span>
                        </div>
                        <div className="insights-metric-pill">
                          <span className="pill-lbl">Avg Attempts / Round:</span>
                          <span className="pill-val">{domain.avgAttempts.toFixed(1)}</span>
                        </div>
                        <div className="insights-metric-pill">
                          <span className="pill-lbl">Total Practice Time:</span>
                          <span className="pill-val">{formatDuration(domain.totalTimeMs)}</span>
                        </div>
                      </div>

                      {/* Insufficient data note */}
                      {isInsufficient && (
                        <div className="insights-insufficient-callout">
                          <strong>Note on Insufficient Data:</strong> Only 1 completed round has been recorded for this domain.
                          Lumora never interprets a single attempt as a pattern or learning difficulty. Additional gameplay sessions are required.
                        </div>
                      )}

                      {/* Concrete round-by-round evidence breakdown */}
                      <div className="insights-rounds-table-wrap">
                        <h5 className="insights-table-title">Recorded Round Evidence:</h5>
                        <table className="insights-table">
                          <thead>
                            <tr>
                              <th>Round Activity</th>
                              <th>Construct Measured</th>
                              <th>Rounds Logged</th>
                              <th>Avg Accuracy</th>
                              <th>In-Game Attempts</th>
                              <th>Last Recorded</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domain.roundBreakdown.map((r) => (
                              <tr key={r.key}>
                                <td>
                                  <strong>{r.title}</strong>
                                  <span className="insights-table-sub">({r.worldName})</span>
                                </td>
                                <td className="insights-table-desc">{r.description}</td>
                                <td>{r.count}</td>
                                <td>
                                  <span className="accuracy-pill" style={{ borderColor: r.avgAccuracy >= 0.8 ? 'var(--cyan)' : 'var(--amber)' }}>
                                    {Math.round(r.avgAccuracy * 100)}%
                                  </span>
                                </td>
                                <td>{r.totalAttempts} ({r.avgAttempts.toFixed(1)}/round)</td>
                                <td>{dateLabel(r.lastPracticed)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Strengths & Growth Areas in this domain */}
                      <div className="insights-observations-grid">
                        <div className="insights-obs-col strengths">
                          <h5>⭐ Observed Strengths</h5>
                          {domain.strengths.length > 0 ? (
                            <ul>
                              {domain.strengths.map((s) => (
                                <li key={s.key}>
                                  <strong>{s.title}</strong>: Strong initial accuracy ({Math.round(s.avgAccuracy * 100)}%) with smooth single-attempt execution.
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="insights-muted">Consistent strength pattern will emerge as more rounds are recorded.</p>
                          )}
                        </div>

                        <div className="insights-obs-col practice">
                          <h5>🎯 Areas Where Support May Help</h5>
                          {domain.growthAreas.length > 0 ? (
                            <ul>
                              {domain.growthAreas.map((g) => (
                                <li key={g.key}>
                                  <strong>{g.title}</strong>: Required repeated attempts ({g.totalAttempts} attempts across {g.count} round{g.count === 1 ? '' : 's'}) averaging {Math.round(g.avgAccuracy * 100)}% accuracy.
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="insights-muted">No repeated difficulty patterns recorded in this domain.</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="insights-domain-empty-notice">
                      <p>No activity has been logged in {domain.worldName} yet.</p>
                      <span className="insights-empty-sub">Once the learner plays rounds in this world, objective evidence will appear here.</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 3: Progress Over Time (Multi-Session Comparable Results) */}
      <section className="insights-section" aria-labelledby="heading-progress">
        <div className="insights-section-header">
          <h3 id="heading-progress">3. Progress Across Sessions</h3>
          <span className="insights-badge-neutral">Multi-Session Longitudinal View</span>
        </div>
        <p className="insights-section-sub">
          Tracking accuracy across sessions for the same activities helps distinguish temporary fatigue from consistent skill development.
        </p>
        <ProgressChart series={series} />
      </section>

      {/* Section 4: "Learning Differences: What to Understand" */}
      <section className="insights-section learning-differences-section" aria-labelledby="heading-differences">
        <div className="insights-section-header">
          <h3 id="heading-differences">4. Learning Differences: What to Understand</h3>
          <span className="insights-badge-warning">General Educational Context · Non-Diagnostic</span>
        </div>

        <div className="insights-education-callout compact">
          <div className="insights-callout-header">
            <span className="insights-callout-icon" aria-hidden="true">💡</span>
            <h4>Brain Wiring, Not Deficits</h4>
          </div>
          <p>
            Learning differences reflect natural cognitive diversity. The brief summaries below provide <em>general educational context</em> because
            activities were recorded in matching learning domains. Lumora <strong>never calculates disease probabilities or establishes clinical diagnoses</strong>.
          </p>
        </div>

        {relevantConditions.length > 0 ? (
          <div className="insights-conditions-grid">
            {relevantConditions.map((cond) => (
              <div key={cond.key} className="insights-condition-card compact">
                <div className="insights-cond-header">
                  <div>
                    <h4 className="insights-cond-name">{cond.name}</h4>
                    <span className="insights-cond-sub">{cond.subtitle}</span>
                  </div>
                  <span className="insights-cond-tag">{cond.worldConnection}</span>
                </div>

                <div className="insights-cond-body compact">
                  <div className="insights-cond-block">
                    <span className="cond-lbl">Overview & Strengths:</span>
                    <p>{cond.definition} {cond.notIntelligence}</p>
                  </div>

                  <div className="insights-cond-block warning">
                    <span className="cond-lbl">In-Game Gameplay Distinction:</span>
                    <p>{cond.gameplayDistinction}</p>
                  </div>

                  {/* Context-aware suggestions depending on active perspective */}
                  <div className="insights-cond-suggestions">
                    {activePerspective === 'teacher' && (
                      <div className="cond-role-box">
                        <span className="role-tag">🍎 Classroom Accommodations:</span>
                        <ul>
                          {cond.classroomSuggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {activePerspective === 'parent' && (
                      <div className="cond-role-box">
                        <span className="role-tag">👪 Home-Support Ideas:</span>
                        <ul>
                          {cond.homeSuggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {(activePerspective === 'specialist' || activePerspective === 'school_admin') && (
                      <div className="cond-role-box">
                        <span className="role-tag">🔬 Collaborative Accommodations:</span>
                        <ul>
                          <li>Classroom: {cond.classroomSuggestions[0]}</li>
                          <li>Home: {cond.homeSuggestions[0]}</li>
                        </ul>
                      </div>
                    )}
                    {activePerspective === 'student' && (
                      <div className="cond-role-box student">
                        <span className="role-tag">⭐ Message for You:</span>
                        <p>{cond.studentMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="insights-no-conditions-box">
            <p>Condition-specific educational information is displayed only when relevant learning domains are recorded.</p>
            <span className="insights-muted">No reading, writing, or mathematics domains have recorded rounds in the current filter.</span>
          </div>
        )}
      </section>

      {/* Section 5: "What Can Help Next?" */}
      <section className="insights-section recommendations-section" aria-labelledby="heading-next-steps">
        <div className="insights-section-header">
          <h3 id="heading-next-steps">5. What Can Help Next?</h3>
          <span className="insights-badge-success">Supportive Educational Suggestions</span>
        </div>
        <p className="insights-section-sub">
          Practical strategies grounded in recorded activity. Educational recommendations, not clinical treatment plans.
        </p>

        {/* Tailored recommendations by role */}
        <div className="insights-recommendations-container">
          {/* Universal General Learning Support */}
          <div className="insights-rec-card universal">
            <div className="rec-card-header">
              <span className="rec-icon" aria-hidden="true">🌱</span>
              <div>
                <h4>General Learning Support Strategies</h4>
                <span className="rec-sub">Applies across all learning realms and study environments</span>
              </div>
            </div>
            <div className="rec-card-body">
              <div className="rec-grid">
                <div className="rec-col">
                  <strong>⏱️ Pacing & Micro-Steps:</strong>
                  <p>Break multi-step instructions into clear, bite-sized tasks with natural pauses.</p>
                </div>
                <div className="rec-col">
                  <strong>👏 Effort Praise:</strong>
                  <p>Acknowledge persistence, creative strategies, and resilience over pure speed.</p>
                </div>
                <div className="rec-col">
                  <strong>🧘 Brain Breaks:</strong>
                  <p>Schedule 5-minute movement pauses between focused blocks to refresh attention.</p>
                </div>
                <div className="rec-col">
                  <strong>📈 Progress Over Time:</strong>
                  <p>Review growth over weeks rather than judging single sessions. Celebrate milestones.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Realm-Specific Next Steps (Grouped by Realm) */}
          {growthAreasByRealm.length > 0 ? (
            <div className="insights-domain-recs-list">
              <h4 className="recs-subheading">Realm-Specific Educational Strategies:</h4>
              {growthAreasByRealm.map((group) => {
                const worldKey = group.worldKey;
                return (
                  <div key={worldKey} className="insights-rec-card targeted">
                    <div className="rec-card-header">
                      <span className="rec-icon" aria-hidden="true">🎯</span>
                      <div>
                        <h4>Targeted Support: {group.worldName}</h4>
                        <span className="rec-sub">
                          Activities with multi-attempt practice ({group.items.length}):{' '}
                          {group.items.map((i) => `${i.title} (${i.totalAttempts} att, ${Math.round(i.avgAccuracy * 100)}%)`).join(' · ')}
                        </span>
                      </div>
                    </div>
                    <div className="rec-card-body">
                      <div className="rec-role-suggestions">
                        {activePerspective === 'teacher' && (
                          <div className="role-suggestion-block">
                            <strong>🍎 Teacher Classroom Strategy:</strong>
                            <p>
                              {worldKey === 'soundForest' && 'Introduce structured phoneme-blending with physical counters or Elkonin sound boxes before reading tasks.'}
                              {worldKey === 'storyCastle' && 'Pre-teach key vocabulary before passage reading. Allow paired or whisper reading with a peer buddy.'}
                              {worldKey === 'runeRealm' && 'Offer pencil grips or raised-line tracing sheets. Allow verbal or typed alternatives to reduce handwriting strain.'}
                              {worldKey === 'memoryMountains' && 'Provide visual checklists and graphic organizers to decrease working memory load during problem solving.'}
                              {worldKey === 'visionValley' && 'Check lighting and screen positioning. Provide high-contrast reading guides or physical trackers.'}
                            </p>
                          </div>
                        )}

                        {activePerspective === 'parent' && (
                          <div className="role-suggestion-block">
                            <strong>👪 Parent Home Suggestion:</strong>
                            <p>
                              {worldKey === 'soundForest' && 'Play silly sound blending games during dinner or car rides (e.g., "Can you guess what word is /s/ /u/ /n/?").'}
                              {worldKey === 'storyCastle' && 'Read favorite books together using echo reading: you read a sentence aloud, and your child reads it back.'}
                              {worldKey === 'runeRealm' && 'Trace letters in salt trays, draw in sidewalk chalk, or play with modeling clay to strengthen finger muscles playfully.'}
                              {worldKey === 'memoryMountains' && 'Play sequence memory games like "I went to the market and bought..." keeping it light and fun.'}
                              {worldKey === 'visionValley' && 'Play "I Spy" games in picture books or spot-the-difference puzzles during quiet time.'}
                            </p>
                          </div>
                        )}

                        {(activePerspective === 'specialist' || activePerspective === 'school_admin') && (
                          <div className="role-suggestion-block">
                            <strong>🔬 Specialist / Administrator Action Plan:</strong>
                            <p>
                              {worldKey === 'soundForest' && 'Track phoneme manipulation accuracy over 4 weeks. Scaffold with auditory-visual synchrony before isolated decoding.'}
                              {worldKey === 'storyCastle' && 'Differentiate sight-word recognition latency from comprehension. Allow assistive text-to-speech for grade-level content.'}
                              {worldKey === 'runeRealm' && 'Analyze trajectory motor planning vs muscular fatigue. Provide ergonomic accommodations and speech-to-text.'}
                              {worldKey === 'memoryMountains' && 'Differentiate sequential memory limits from pattern logic. Provide external visual memory anchors.'}
                              {worldKey === 'visionValley' && 'Assess visual saccadic tracking in natural reading environments vs screen calibration.'}
                            </p>
                          </div>
                        )}

                        {activePerspective === 'student' && (
                          <div className="role-suggestion-block student">
                            <strong>⭐ Your Next Quest in {group.worldName}:</strong>
                            <p>
                              Ready for another adventure? Try a short, fun quest in {group.worldName}!
                              Take all the time you need, and celebrate every star you earn!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="insights-rec-card targeted">
              <div className="rec-card-header">
                <span className="rec-icon" aria-hidden="true">✨</span>
                <div>
                  <h4>Balanced Exploratory Recommendations</h4>
                  <span className="rec-sub">No acute difficulty patterns recorded</span>
                </div>
              </div>
              <div className="rec-card-body">
                <p>
                  The student’s recorded rounds reflect steady progress across realms.
                  Encourage continuing varied quests across all five worlds (Sound Forest, Story Castle, Rune Realm, Memory Mountains, Vision Valley)
                  to build broad cognitive fluency while keeping learning enjoyable.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Five Learning Worlds Coverage & Complete Log */}
      <section className="insights-section" aria-labelledby="heading-all-worlds">
        <div className="insights-section-header">
          <h3 id="heading-all-worlds">6. Comprehensive Five Worlds Record</h3>
          <span className="insights-badge-neutral">Full Realm Coverage</span>
        </div>
        <p className="insights-section-sub">
          Summary of participation across all five Lumora realms.
        </p>

        <div className="insights-worlds-summary-grid">
          {WORLD_ORDER.map((wKey) => {
            const wMeta = WORLDS[wKey];
            const wRounds = activityLog.filter((item) => item.world === wKey);
            const isCompleted = Boolean(effectiveLearner?.worldsCompleted?.[wKey]);
            const avgAcc = wRounds.length ? wRounds.reduce((s, i) => s + i.accuracy, 0) / wRounds.length : null;

            return (
              <div key={wKey} className={`insights-world-mini-card ${isCompleted ? 'mastered' : ''}`} style={{ borderColor: wMeta.color }}>
                <div className="mini-card-top">
                  <span className="mini-icon" aria-hidden="true">{wMeta.icon}</span>
                  <div className="mini-info">
                    <strong>{wMeta.name}</strong>
                    <span className="mini-focus">{wMeta.focus.split('·')[0].trim()}</span>
                  </div>
                </div>
                <div className="mini-card-stats">
                  <span>{wRounds.length} rounds logged</span>
                  <span>{avgAcc !== null ? `${Math.round(avgAcc * 100)}% avg` : 'Not yet played'}</span>
                </div>
                <div className="mini-card-status">
                  {isCompleted ? <span className="mini-badge done">★ Mastered</span> : <span className="mini-badge pending">{wRounds.length ? 'In Progress' : 'Unexplored'}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Transparency & Governance */}
      <footer className="insights-transparency">
        <p>
          <strong>Data Governance & Transparency:</strong> This report reflects recorded performance on Lumora World learning activities.
          It is bounded by the activities completed within the active sessions. Lumora stores completed round results and does not store unmeasured metrics or clinical indicators.
          This report is designed for constructive educational dialogue between students, parents, teachers, and specialists. It does not replace a multidisciplinary clinical evaluation.
        </p>
      </footer>
    </section>
  );
}
