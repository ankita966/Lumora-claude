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

// In-memory cache keyed by pseudonym + activity count + selected world
const insightsCache = new Map();

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
 * Fetches structured AI learning insights for a given learner.
 * Uses local rule-based fallback if offline or if backend is unreachable.
 *
 * @param {Object} params
 * @param {Object} params.learner - Student learner record or sample learner
 * @param {string} [params.role='teacher'] - Perspective view
 * @param {string} [params.selectedWorld='all'] - World filter
 * @param {boolean} [params.forceRefresh=false] - Bypass cache
 * @returns {Promise<Object>} Formatted insights result
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

    // Reliable client-side fallback if network is completely down
    const fallbackResult = {
      source: 'fallback',
      engine: 'Client Rule-Based Offline Engine',
      model: null,
      notice: 'API endpoint unreachable. Showing offline rule-based insights. Never claimed to be Gemini-generated.',
      timestamp: new Date().toISOString(),
      error: error.message,
      data: {
        summary: payload.activities.length > 0
          ? `The learner has engaged in ${payload.activities.length} activity round(s) with demonstrated persistence across challenges. Observations indicate active engagement with room for focused practice.`
          : 'No recorded gameplay activities found. Play through realms to generate personalized learning insights.',
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

    insightsCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

