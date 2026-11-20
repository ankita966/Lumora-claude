/**
 * LUMORA INSIGHT — Client Service
 *
 * Securely extracts, pseudonymises, and submits activity telemetry
 * to the backend Gemini API (/api/insights).
 *
 * PRIVACY GUARANTEE:
 * - Strips all PII (names, emails, user IDs, dates of birth).
 * - Generates synthetic session pseudonyms.
 * - Only sends structured game activity data (world, round, accuracy, attempts, duration).
 * - Enforces client-side caching to minimize redundant network traffic.
 */

// In-memory cache keyed by pseudonym + activity count + selected world + role
const insightsCache = new Map();

const WORLDS_METAS = {
  soundForest: {
    name: 'Sound Forest',
    constructs: 'Phonological awareness, letter-sound recognition, phoneme blending, auditory discrimination, spoken pronunciation',
    defaultRecommendations: [
      'Play rhyming and initial-sound matching games with household objects.',
      'Practice blending segmented words phoneme-by-phoneme during story time (/c/-/a/-/t/ -> cat).',
      'Use playful echo-singing and alliteration rhymes to build auditory confidence.',
    ],
    defaultActivities: [
      'Sound Forest Round 1: Slash Quest (Auditory sound discrimination)',
      'Sound Forest Round 3: Phoneme Blend (Auditory synthesis)',
    ],
  },
  visionValley: {
    name: 'Vision Valley',
    constructs: 'Visual tracking, smooth pursuit, saccadic target acquisition, visual discrimination, visual-motor timing',
    defaultRecommendations: [
      'Encourage flashlight tag or ball-catching games to support smooth visual pursuit.',
      'Explore hidden-picture puzzles and spot-the-difference visual books.',
      'Provide visual anchors (ruler or card bookmark) when scanning complex pages.',
    ],
    defaultActivities: [
      'Vision Valley Round 1: Follow (Smooth pursuit tracking)',
      'Vision Valley Round 4: Slash (Visual-motor timing)',
    ],
  },
  storyCastle: {
    name: 'Story Castle',
    constructs: 'Sight-word recognition, sentence decoding, reading fluency, story sequencing, reading comprehension',
    defaultRecommendations: [
      'Pair connected reading with shared paired-reading (reading aloud in unison).',
      'Highlight high-frequency sight words in engaging graphic novels.',
      'Ask open-ended sequencing questions ("What happened first, next, and at the end?").',
    ],
    defaultActivities: [
      'Story Castle Round 1: Magic Words (Sight word recognition)',
      'Story Castle Round 4: Story Path (Narrative sequencing)',
    ],
  },
  runeRealm: {
    name: 'Rune Realm',
    constructs: 'Letter formation, number formation, fine-motor coordination, tracing precision, continuous stroke planning',
    defaultRecommendations: [
      'Practice letter and number strokes in sensory trays (sand, salt, or finger-paint).',
      'Encourage fun fine-motor warmups (clay squeezing, bead threading, origami).',
      'Offer ergonomic pencil grips and comfortable writing angles.',
    ],
    defaultActivities: [
      'Rune Realm Round 2: Magic Letter A (Letter stroke formation)',
      'Rune Realm Round 3: Magic Number 3 (Arc reversal & digit control)',
    ],
  },
  memoryMountains: {
    name: 'Memory Mountains',
    constructs: 'Visual working memory, object recall, sequential recall, pattern recognition, memory updating',
    defaultRecommendations: [
      'Play memory tray games (observe 4-5 items, hide one, guess what is missing).',
      'Break multi-step requests into clear 1-2 step instructions paired with visual checklists.',
      'Engage in rhythmic pattern-clapping and sequential movement games.',
    ],
    defaultActivities: [
      'Memory Mountains Round 1: Remember Objects (Visual item recall)',
      'Memory Mountains Round 4: Follow the Pattern (Sequential pattern reasoning)',
    ],
  },
};

/**
 * Deterministic short pseudonym generator from any raw learner identifier.
 * Produces an anonymous token like 'learner_8f3a' without revealing real names.
 */
function createSafePseudonym(rawId) {
  const str = String(rawId || 'guest_explorer');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
  return `learner_${hex}`;
}

/**
 * Extracts and pseudonymises learner activities into a minimal, safe payload.
 */
export function pseudonymiseLearnerData(learner, selectedWorld = 'all') {
  if (!learner) {
    return {
      pseudonym: 'learner_anon',
      ageBand: 'Primary (Ages 5–11)',
      activities: [],
    };
  }

  const rawActivities = Array.isArray(learner.activityLog) ? learner.activityLog : [];
  const filtered = selectedWorld === 'all'
    ? rawActivities
    : rawActivities.filter((a) => a.world === selectedWorld);

  const activities = filtered.map((act, idx) => ({
    index: idx + 1,
    world: String(act.world || 'unknown').slice(0, 32),
    round: Number(act.round) || 1,
    activity: String(act.title || act.skill || `Round ${act.round || 1}`).slice(0, 64),
    domain: String(act.domain || act.skill || 'general').slice(0, 48),
    accuracy: Math.max(0, Math.min(1, typeof act.accuracy === 'number' ? act.accuracy : 0)),
    attempts: Math.max(1, Math.min(20, Number(act.attempts) || 1)),
    duration_seconds: Math.max(
      1,
      Math.min(3600, Math.round((Number(act.timeMs) || Number(act.durationMs) || 12000) / 1000))
    ),
    hints: Math.max(0, Math.min(10, Number(act.hints) || 0)),
    completion_status: act.completed !== false ? 'completed' : 'in-progress',
  }));

  return {
    pseudonym: createSafePseudonym(learner.id || learner.displayName || 'anonymous_explorer'),
    ageBand: learner.grade || learner.ageBand || 'Primary (Ages 5–11)',
    activities,
  };
}

/**
 * Generates local world-wise fallback insights if network or backend is unreachable.
 */
function buildClientFallback(payload) {
  const byWorld = {};
  for (const act of payload.activities) {
    if (!byWorld[act.world]) byWorld[act.world] = [];
    byWorld[act.world].push(act);
  }

  const worldInsights = {};
  for (const [wKey, meta] of Object.entries(WORLDS_METAS)) {
    const rounds = byWorld[wKey] || [];
    const count = rounds.length;
    if (count === 0) {
      worldInsights[wKey] = {
        worldKey: wKey,
        worldName: meta.name,
        constructs: meta.constructs,
        dataSufficiency: 'no_data',
        summary: `No activity recorded in ${meta.name} yet. Starting exploratory rounds will provide objective learning evidence for ${meta.constructs.toLowerCase()}.`,
        strengths: [],
        supportAreas: [],
        practiceRecommendations: meta.defaultRecommendations,
        suggestedActivities: meta.defaultActivities,
      };
      continue;
    }

    const avg = rounds.reduce((s, r) => s + (Number(r.accuracy) || 0), 0) / count;
    const avgPct = Math.round(avg * 100);
    const avgAttempts = rounds.reduce((s, r) => s + (Number(r.attempts) || 1), 0) / count;
    const isSufficient = count >= 2;

    const strengths = rounds.filter((r) => r.accuracy >= 0.75).map((r) => ({
      title: `${r.activity} Mastery`,
      description: `Logged ${Math.round(r.accuracy * 100)}% accuracy on ${r.activity} with ${r.attempts} attempt(s).`,
      highlight: 'Confident pacing and strong task completion.',
    }));

    const supportAreas = rounds.filter((r) => r.accuracy < 0.75 || r.attempts > 1).map((r) => ({
      title: `${r.activity} Practice Area`,
      description: `Required ${r.attempts} attempts on ${r.activity} averaging ${Math.round(r.accuracy * 100)}% accuracy.`,
      explanationOfEvidence: `Multi-attempt rounds reflect persistence through challenge.`,
      supportiveSuggestion: `Short, self-paced sessions with multisensory cues can build confidence.`,
    }));

    worldInsights[wKey] = {
      worldKey: wKey,
      worldName: meta.name,
      constructs: meta.constructs,
      dataSufficiency: isSufficient ? 'sufficient' : 'insufficient',
      summary: isSufficient
        ? `In ${meta.name}, ${count} completed round(s) demonstrate ${avgPct}% average accuracy with ${avgAttempts.toFixed(1)} attempts per challenge.`
        : `Preliminary data in ${meta.name} (1 round recorded, ${avgPct}% accuracy). Further gameplay is needed before identifying patterns.`,
      strengths: strengths.length > 0 ? strengths : [
        {
          title: 'Curiosity & Effort',
          description: `Began initial practice in ${meta.name} with enthusiastic participation.`,
          highlight: 'Great persistence trying new challenge formats!',
        },
      ],
      supportAreas,
      practiceRecommendations: meta.defaultRecommendations,
      suggestedActivities: meta.defaultActivities,
    };
  }

  return {
    source: 'fallback',
    engine: 'Client Rule-Based Offline Engine',
    model: null,
    notice: 'API endpoint unreachable. Showing offline rule-based insights. Never claimed to be Gemini-generated.',
    timestamp: new Date().toISOString(),
    data: {
      summary: payload.activities.length > 0
        ? `The learner has completed ${payload.activities.length} activity round(s) across Lumora World. Observations indicate steady persistence and engagement.`
        : 'No recorded gameplay activities found. Play through realms to generate personalized learning insights.',
      worldInsights,
      strengths: payload.activities
        .filter((a) => a.accuracy >= 0.75)
        .slice(0, 3)
        .map((a) => ({
          world: a.world,
          domain: a.domain,
          description: `Demonstrated ${Math.round(a.accuracy * 100)}% accuracy on ${a.activity}.`,
          highlight: 'Strong task mastery and confident pace.',
        })),
      practiceAreas: payload.activities
        .filter((a) => a.accuracy < 0.7 || a.attempts > 1)
        .slice(0, 3)
        .map((a) => ({
          world: a.world,
          domain: a.domain,
          description: `Encountered multi-step challenges on ${a.activity} (${a.attempts} attempt(s)).`,
          rationale: 'Repetition with multisensory cues strengthens learning retention.',
          supportiveSuggestion: 'Offer self-paced exploratory sessions with cheerful audio feedback.',
        })),
      progressObservations: [
        {
          observation: `Logged ${payload.activities.length} challenge rounds across Lumora World.`,
          trend: payload.activities.some((a) => a.accuracy >= 0.8) ? 'improving' : 'developing',
        },
      ],
      recommendedActivities: [
        {
          world: 'soundForest',
          activityTitle: 'Phoneme Match & Blend',
          focus: 'Auditory letter-sound practice with Phono',
          encouragingNote: 'Keep exploring joyful sound quests!',
        },
      ],
    },
  };
}

/**
 * Fetches structured AI learning insights for a given learner.
 * Uses local rule-based fallback if offline or if backend is unreachable.
 */
export async function fetchGeminiInsights({
  learner,
  role = 'teacher',
  selectedWorld = 'all',
  forceRefresh = false,
}) {
  const payload = pseudonymiseLearnerData(learner, selectedWorld);
  const cacheKey = `${payload.pseudonym}_${payload.activities.length}_${selectedWorld}_${role}`;

  if (!forceRefresh && insightsCache.has(cacheKey)) {
    return insightsCache.get(cacheKey);
  }

  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        perspectiveRole: role,
      }),
    });

    if (!response.ok) {
      throw new Error(`API endpoint responded with status ${response.status}`);
    }

    const result = await response.json();
    insightsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('[fetchGeminiInsights] Network or API failure, generating client fallback:', error.message);
    const fallbackResult = buildClientFallback(payload);
    fallbackResult.error = error.message;
    insightsCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
