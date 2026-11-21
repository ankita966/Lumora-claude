/**
 * Secure Backend API Endpoint for LUMORA INSIGHT.
 * Works seamlessly in both:
 * 1. Production (Vercel Serverless Functions / Node / Cloud Functions)
 * 2. Local Development (Vite dev & preview Connect middleware)
 *
 * SECRECY: GEMINI_API_KEY is read strictly server-side from process.env.
 * PRIVACY: Accepts only pseudonymised activity records. Rejects any PII.
 * SAFETY: Strictly non-diagnostic educational prompt engineering.
 * FALLBACK: If Gemini API key is missing or API is unreachable, provides
 *           a transparently labeled rule-based deterministic fallback.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

const MAX_BODY_BYTES = 50 * 1024; // 50 KB request-size limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute per IP

// In-memory sliding rate-limit map: ip -> { count, resetTime }
const rateLimitMap = new Map();

// Periodic cleanup of stale rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * RATE LIMITING & CLIENT IP ARCHITECTURE NOTE (Google Cloud Run):
 *
 * 1. Distributed Autoscaling Limitation:
 *    The in-memory rate limiter (rateLimitMap) is local to each Node.js process /
 *    Cloud Run container instance. When Cloud Run horizontally autoscales across
 *    multiple instances, memory is NOT shared between instances. Consequently:
 *    - In-memory rate limiting functions strictly as an effective per-instance burst-protection
 *      guard (preventing a single container instance from being overwhelmed by rapid bursts).
 *    - For global, distributed rate limiting across autoscaled instances in high-traffic
 *      production, Google Cloud Armor (edge DDoS protection / rate limiting) or a centralized
 *      cache (Google Cloud Memorystore for Redis) must be deployed in front of Cloud Run.
 *
 * 2. Proxy Behaviour & X-Forwarded-For Trust Boundary:
 *    In Google Cloud Run, incoming HTTP requests traverse Google Front End (GFE) proxies.
 *    If an external client includes an 'X-Forwarded-For' header in their request, GFE
 *    appends the true connecting IP to the end of the chain (e.g. "client_sent_ip, real_client_ip").
 *    Crucially:
 *    - Regex validation (/^[0-9a-fA-F:.]+$/) is purely syntactic hygiene to prevent header
 *      injection and control characters. It DOES NOT prove or guarantee that an IP is authentic
 *      or trusted.
 *    - Without Google Cloud Armor or an API gateway stripping unverified client-supplied headers,
 *      an untrusted caller can prepend arbitrary IP addresses to X-Forwarded-For to evade
 *      per-IP rate limits that inspect only the leftmost entry.
 *    - Therefore, this in-memory rate limiter is strictly an application-layer defense-in-depth
 *      burst guard, not a zero-trust network boundary or cryptographic identity mechanism.
 */
function getClientIp(req) {
  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const candidate = forwarded.split(',')[0].trim();
    // Syntactic sanity check only: prevents header injection; does not imply cryptographic trust
    if (/^[0-9a-fA-F:.]+$/.test(candidate) && candidate.length <= 45) {
      return candidate;
    }
  }

  const remote = req.socket?.remoteAddress;
  if (typeof remote === 'string' && /^[0-9a-fA-F:.]+$/.test(remote) && remote.length <= 45) {
    return remote;
  }

  return '127.0.0.1';
}

function checkRateLimit(clientIp) {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetInSeconds: 60 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetInSeconds: Math.ceil((entry.resetTime - now) / 1000) };
}

/**
 * System instruction enforcing strengths-first educational insights
 * and an absolute non-diagnostic mandate.
 */
const SYSTEM_INSTRUCTION = `You are LUMORA INSIGHT, an empathetic, supportive educational AI assistant for Lumora World (a playful learning platform for children aged 3–11 across 5 learning worlds: Sound Forest, Vision Valley, Story Castle, Rune Realm, and Memory Mountains).

YOUR CRITICAL RULES:
1. STRICT NON-DIAGNOSTIC MANDATE: NEVER diagnose, predict, or evaluate medical, cognitive, psychological, or neurological disorders (such as ADHD, dyslexia, dysgraphia, dyscalculia, or autism). NEVER claim gameplay establishes that a student has any disorder. NEVER assign risk scores, condition rankings, or disease probabilities.
2. STRENGTHS-FIRST, ASSET-BASED LANGUAGE: Celebrate persistence, effort, and what the child does well. Avoid deficit framing or clinical jargon.
3. GROUNDED IN EVIDENCE ONLY: Base every observation strictly on the provided pseudonymised gameplay activity data (accuracy, attempts, duration, and completion). Do not infer unmeasured difficulties or extrapolate unrelated metrics.
4. WORLD-WISE EDUCATIONAL CONSTRUCTS:
   - Sound Forest: Phonological awareness, letter-sound recognition, phoneme blending, auditory discrimination, spoken pronunciation.
   - Vision Valley: Visual tracking, smooth pursuit, saccadic target acquisition, visual discrimination, visual-motor timing.
   - Story Castle: Sight-word recognition, sentence decoding, reading fluency, story sequencing, reading comprehension.
   - Rune Realm: Letter formation, number formation, fine-motor coordination, tracing precision, continuous stroke planning.
   - Memory Mountains: Visual working memory, object recall, sequential recall, pattern recognition, memory updating.
5. DATA SUFFICIENCY: Distinguish actual recorded patterns (>= 2 rounds) from insufficient data (1 round) or no data (0 rounds). Explicitly state if there is insufficient evidence.
6. RETURN VALID JSON ONLY adhering exactly to the requested JSON schema.`;

const WORLDS_CONFIG = {
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
 * Deterministic fallback generator when Gemini API is unavailable.
 * Honestly labeled as a non-AI rule-based fallback.
 */
function generateDeterministicFallback(activityRecords) {
  const records = Array.isArray(activityRecords) ? activityRecords : [];
  const totalRounds = records.length;
  const avgAccuracy = totalRounds > 0
    ? Math.round((records.reduce((sum, r) => sum + (Number(r.accuracy) || 0), 0) / totalRounds) * 100)
    : 0;

  const strengthsList = [];
  const practiceList = [];

  const byWorld = {};
  for (const r of records) {
    if (!byWorld[r.world]) byWorld[r.world] = [];
    byWorld[r.world].push(r);
  }

  // Generate World-wise Insights for each of the 5 worlds
  const worldInsights = {};

  for (const [worldKey, config] of Object.entries(WORLDS_CONFIG)) {
    const worldRounds = byWorld[worldKey] || [];
    const count = worldRounds.length;

    if (count === 0) {
      worldInsights[worldKey] = {
        worldKey,
        worldName: config.name,
        constructs: config.constructs,
        dataSufficiency: 'no_data',
        summary: `No activity recorded in ${config.name} yet. Starting exploratory rounds will provide objective learning evidence for ${config.constructs.toLowerCase()}.`,
        strengths: [],
        supportAreas: [],
        practiceRecommendations: config.defaultRecommendations,
        suggestedActivities: config.defaultActivities,
      };
      continue;
    }

    const worldAvg = worldRounds.reduce((s, r) => s + (Number(r.accuracy) || 0), 0) / count;
    const worldAvgPct = Math.round(worldAvg * 100);
    const worldAttempts = worldRounds.reduce((s, r) => s + (Number(r.attempts) || 1), 0) / count;
    const isSufficient = count >= 2;

    const wStrengths = [];
    const wSupportAreas = [];

    // Analyze high accuracy rounds
    const highAccRounds = worldRounds.filter((r) => Number(r.accuracy) >= 0.75);
    if (highAccRounds.length > 0) {
      wStrengths.push({
        title: `${config.name} Task Mastery`,
        description: `Logged strong performance across ${highAccRounds.length} round(s) with accuracy averaging ${Math.round((highAccRounds.reduce((s, r) => s + Number(r.accuracy), 0) / highAccRounds.length) * 100)}%.`,
        highlight: `Demonstrated smooth execution and confident focus on ${highAccRounds.map((r) => r.activity).slice(0, 2).join(', ')}.`,
      });
    }

    // Analyze multi-attempt or lower accuracy rounds
    const challengeRounds = worldRounds.filter((r) => Number(r.accuracy) < 0.7 || Number(r.attempts) > 1);
    if (challengeRounds.length > 0) {
      wSupportAreas.push({
        title: `${config.name} Exploratory Practice`,
        description: `Encountered multi-attempt challenges on ${challengeRounds.map((r) => r.activity).slice(0, 2).join(', ')} (${challengeRounds.length} round(s) requiring extra attempts).`,
        explanationOfEvidence: `Recorded average of ${worldAttempts.toFixed(1)} attempts per round with ${worldAvgPct}% accuracy. Multi-attempt rounds reflect active problem-solving and persistence.`,
        supportiveSuggestion: `Use multisensory cues and short 5-minute self-paced practice to build familiarity and ease cognitive load.`,
      });
    }

    worldInsights[worldKey] = {
      worldKey,
      worldName: config.name,
      constructs: config.constructs,
      dataSufficiency: isSufficient ? 'sufficient' : 'insufficient',
      summary: isSufficient
        ? `In ${config.name}, ${count} completed round(s) demonstrate ${worldAvgPct}% average accuracy with ${worldAttempts.toFixed(1)} attempts per challenge. The evidence highlights sustained engagement in ${config.constructs.toLowerCase()}.`
        : `Preliminary data in ${config.name} (1 round recorded, ${worldAvgPct}% accuracy). Lumora never establishes learning patterns from a single round. Additional sessions are recommended for reliable trends.`,
      strengths: wStrengths.length > 0 ? wStrengths : [
        {
          title: 'Curiosity & Effort',
          description: `Began initial practice in ${config.name} with enthusiastic participation.`,
          highlight: 'Great persistence trying new challenge formats!',
        },
      ],
      supportAreas: wSupportAreas,
      practiceRecommendations: config.defaultRecommendations,
      suggestedActivities: config.defaultActivities,
    };

    // Global strengths/practice lists
    if (worldAvg >= 0.75) {
      strengthsList.push({
        world: worldKey,
        domain: worldRounds[0]?.domain || worldKey,
        description: `Strong engagement in ${config.name} (${count} round(s), ${worldAvgPct}% accuracy).`,
        highlight: 'Confident pacing and high task completion.',
      });
    } else if (worldAvg < 0.7 || worldAttempts >= 2) {
      practiceList.push({
        world: worldKey,
        domain: worldRounds[0]?.domain || worldKey,
        description: `Encountered multi-attempt challenges in ${config.name} (${worldAvgPct}% accuracy across ${count} round(s)).`,
        rationale: 'Additional exploratory rounds with multisensory guidance can build confidence.',
        supportiveSuggestion: 'Try short, self-paced sessions with positive encouragement after each round.',
      });
    }
  }

  if (strengthsList.length === 0 && totalRounds > 0) {
    strengthsList.push({
      world: records[0].world,
      domain: records[0].domain || 'Learning Exploration',
      description: 'Active curiosity and steady persistence in beginning new learning activities.',
      highlight: 'Great effort exploring new realms!',
    });
  }

  return {
    summary: totalRounds > 0
      ? `The learner has completed ${totalRounds} activity round(s) across ${Object.keys(byWorld).length} learning realm(s) with an overall accuracy of ${avgAccuracy}%. The recorded data shows enthusiastic effort and persistence across structured challenges.`
      : 'No activity data recorded yet. Starting short playful sessions in any of the 5 realms will unlock evidence-based insights.',
    worldInsights,
    strengths: strengthsList,
    practiceAreas: practiceList,
    progressObservations: [
      {
        observation: `Active across ${Object.keys(byWorld).length} realm(s), logging ${totalRounds} completed challenge(s).`,
        trend: avgAccuracy >= 80 ? 'improving' : 'developing',
      },
      {
        observation: 'Shows willingness to retry tasks when encountering multi-attempt rounds.',
        trend: 'steady',
      },
    ],
    recommendedActivities: [
      {
        world: 'soundForest',
        activityTitle: 'Sound Blend & Phoneme Discovery',
        focus: 'Auditory letter-sound practice with Phono',
        encouragingNote: 'Explore cheerful sounds at your own rhythm!',
      },
      {
        world: 'storyCastle',
        activityTitle: 'Magic Words Story Quest',
        focus: 'Sight word recognition and text comprehension',
        encouragingNote: 'Uncover sparkling words in Luna’s castle library.',
      },
    ],
  };
}

const ALLOWED_WORLDS = new Set([
  'soundForest',
  'visionValley',
  'storyCastle',
  'runeRealm',
  'memoryMountains',
]);

const ALLOWED_DOMAINS = new Set([
  'phonological',
  'reading',
  'writing_motor',
  'math_number',
  'memory',
  'vision',
  'sound',
  'motor',
  'numbersense',
  'general',
]);

const ALLOWED_AGE_BANDS = new Set([
  'Early Years (Ages 3–5)',
  'Primary (Ages 5–8)',
  'Intermediate (Ages 8–11)',
  'Primary (Ages 5–11)',
  'Not provided',
]);

const ALLOWED_PERSPECTIVE_ROLES = new Set([
  'student',
  'parent',
  'teacher',
  'specialist',
]);

function sanitizePerspectiveRole(rawRole) {
  if (typeof rawRole !== 'string' || !rawRole.trim()) {
    return 'teacher';
  }
  const normalized = rawRole.trim().toLowerCase();
  return ALLOWED_PERSPECTIVE_ROLES.has(normalized) ? normalized : 'teacher';
}

// Canonical round activities per world for strict matching
const APPROVED_ROUND_TITLES = {
  soundForest: [
    'Slash Quest',
    'Sound Match',
    'Phoneme Blend',
    'Pronounce It',
    'Word Recognition',
  ],
  visionValley: [
    'Follow',
    'Catch',
    'Select',
    'Slash',
    'Mixed Magic',
  ],
  storyCastle: [
    'Magic Words',
    'Missing Word',
    'Read Aloud',
    'Story Path',
    'Story Question',
  ],
  runeRealm: [
    'Magic Circle',
    'Magic Letter (A)',
    'Magic Number (3)',
    'Magic Star',
    'Ancient Rune',
  ],
  memoryMountains: [
    'Remember Objects',
    "What's Missing?",
    'Remember the Order',
    'Follow the Pattern',
    'Memory Master Challenge',
  ],
};

function sanitizeActivityName(rawActivity, worldKey, roundNum) {
  const round = Math.max(1, Math.min(20, roundNum));
  const fallback = `Round ${round}`;
  if (typeof rawActivity !== 'string' || !rawActivity.trim()) {
    return fallback;
  }

  const cleaned = rawActivity.trim();

  // Match against approved round titles for this world (case-insensitive)
  const approvedList = APPROVED_ROUND_TITLES[worldKey] || [];
  for (const approved of approvedList) {
    if (cleaned.toLowerCase() === approved.toLowerCase()) {
      return approved;
    }
  }

  // Allow standard safe "Round X" format
  if (/^round\s+\d+$/i.test(cleaned)) {
    return `Round ${round}`;
  }

  // If passed an approved domain/skill name, map to canonical round title if in range
  if (ALLOWED_DOMAINS.has(cleaned.toLowerCase())) {
    if (round >= 1 && round <= approvedList.length) {
      return approvedList[round - 1];
    }
    return fallback;
  }

  // Any unapproved free-text / arbitrary string is strictly normalized to "Round X"
  // to ensure zero identifying information or PII can enter the prompt payload.
  return fallback;
}

function sanitizeDomain(rawDomain) {
  if (typeof rawDomain !== 'string' || !rawDomain.trim()) {
    return 'general';
  }
  const normalized = rawDomain.trim().toLowerCase();
  return ALLOWED_DOMAINS.has(normalized) ? normalized : 'general';
}

function sanitizePseudonym(rawPseudonym) {
  if (typeof rawPseudonym !== 'string' || !rawPseudonym.trim()) {
    return 'learner_anon';
  }
  const trimmed = rawPseudonym.trim();
  if (trimmed === 'learner_anon') {
    return 'learner_anon';
  }
  // Must match strict pseudonym token pattern: learner_[4-16 hex chars]
  if (/^learner_[a-f0-9]{4,16}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  // Arbitrary names, emails, student IDs, or free-text are rejected
  return 'learner_anon';
}

function sanitizeAgeBand(rawAgeBand) {
  if (typeof rawAgeBand !== 'string' || !rawAgeBand.trim()) {
    return 'Not provided';
  }
  const trimmed = rawAgeBand.trim();
  // Never invent a default age band; only accept explicit approved values
  return ALLOWED_AGE_BANDS.has(trimmed) ? trimmed : 'Not provided';
}

/**
 * Strips any potential identifying user info from payload.
 * Enforces strict allowlists for worlds, domains, age bands, and pseudonyms.
 * Discards records with invalid worlds (never silently defaults to soundForest).
 */
function sanitizePayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { pseudonym: 'learner_anon', ageBand: 'Not provided', perspectiveRole: 'teacher', activities: [] };
  }

  const pseudonym = sanitizePseudonym(raw.pseudonym);
  const ageBand = sanitizeAgeBand(raw.ageBand);
  const perspectiveRole = sanitizePerspectiveRole(raw.perspectiveRole);

  const rawActivities = Array.isArray(raw.activities) ? raw.activities : [];
  const activities = [];

  for (let idx = 0; idx < Math.min(rawActivities.length, 50); idx++) {
    const item = rawActivities[idx];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }

    const rawWorld = typeof item.world === 'string' ? item.world.trim() : '';
    // Explicit world validation: must be in ALLOWED_WORLDS. Discard invalid worlds!
    if (!ALLOWED_WORLDS.has(rawWorld)) {
      continue;
    }
    const world = rawWorld;

    const rawRound = Math.floor(Number(item.round));
    const round = Number.isFinite(rawRound) ? Math.max(1, Math.min(20, rawRound)) : 1;

    const activity = sanitizeActivityName(item.activity || item.title, world, round);
    const domain = sanitizeDomain(item.domain || item.skill);

    const rawAcc = Number(item.accuracy);
    const accuracy = Number.isFinite(rawAcc) ? Math.max(0, Math.min(1, rawAcc)) : 0;

    const rawAttempts = Math.floor(Number(item.attempts));
    const attempts = Number.isFinite(rawAttempts) ? Math.max(1, Math.min(20, rawAttempts)) : 1;

    const rawDuration = Number(item.duration_seconds ?? ((Number(item.timeMs) || Number(item.durationMs) || 10000) / 1000));
    const duration_seconds = Number.isFinite(rawDuration) ? Math.max(1, Math.min(3600, Math.round(rawDuration))) : 10;

    const rawHints = Math.floor(Number(item.hints));
    const hints = Number.isFinite(rawHints) ? Math.max(0, Math.min(10, rawHints)) : 0;

    // Completion status validation:
    // 1. Explicit 'in-progress' must NEVER become 'completed' regardless of item.completed.
    // 2. Explicit item.completed === false must always yield 'in-progress'.
    // 3. Only explicit 'completed' or item.completed === true yields 'completed'.
    // 4. Default if unspecified is 'in-progress'.
    let completion_status = 'in-progress';
    if (item.completion_status === 'in-progress' || item.completed === false) {
      completion_status = 'in-progress';
    } else if (item.completion_status === 'completed' || item.completed === true) {
      completion_status = 'completed';
    } else {
      completion_status = 'in-progress';
    }

    activities.push({
      index: activities.length + 1,
      world,
      round,
      activity,
      domain,
      accuracy,
      attempts,
      duration_seconds,
      hints,
      completion_status,
    });
  }

  return {
    pseudonym,
    ageBand,
    perspectiveRole,
    activities,
  };
}

/**
 * Main request handler.
 * Compatible with Vercel Serverless Functions and Node Connect/Express middleware.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  // 1. In-memory Rate Limiting per IP with trusted client-IP extraction
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
    return;
  }

  // 2. Request Size Validation (Header Check)
  const contentLength = req.headers ? Number(req.headers['content-length']) : null;
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    res.statusCode = 413;
    res.end(JSON.stringify({ error: 'Payload Too Large. Maximum allowed request size is 50KB.' }));
    return;
  }

  // 3. Parse incoming body with size limit while streaming
  let body = req.body;
  if (!body) {
    try {
      const chunks = [];
      let totalBytes = 0;
      for await (const chunk of req) {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        totalBytes += buf.length;
        if (totalBytes > MAX_BODY_BYTES) {
          res.statusCode = 413;
          res.end(JSON.stringify({ error: 'Payload Too Large. Maximum allowed request size is 50KB.' }));
          return;
        }
        chunks.push(buf);
      }
      const text = Buffer.concat(chunks).toString('utf8');
      body = JSON.parse(text);
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON payload in request body.' }));
      return;
    }
  }

  // 4. Strict input structure validation
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid payload structure. Expected JSON object.' }));
    return;
  }

  const sanitized = sanitizePayload(body);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const requestedModel = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();

  // If GEMINI_API_KEY is not configured, return honestly labeled fallback
  if (!apiKey) {
    const fallbackData = generateDeterministicFallback(sanitized.activities);
    res.statusCode = 200;
    res.end(JSON.stringify({
      source: 'fallback',
      engine: 'Rule-Based Deterministic Engine (Offline Fallback)',
      model: null,
      notice: 'Gemini API key is not configured in the server environment. This report was generated by Lumora’s built-in rule-based learning insights engine.',
      timestamp: new Date().toISOString(),
      data: fallbackData,
    }));
    return;
  }

  // Gemini API Request payload
  const promptText = `Analyze the following pseudonymised gameplay activities recorded in Lumora World for ${sanitized.pseudonym} (${sanitized.ageBand}) from the educational perspective of a ${sanitized.perspectiveRole}.

Recorded Activity Records:
${JSON.stringify(sanitized.activities, null, 2)}

Provide strengths-first, world-wise learning insights in structured JSON matching this schema:
{
  "summary": "2-3 sentences summarizing overall engagement, resilience, and general patterns across all realms without clinical diagnosis.",
  "worldInsights": {
    "soundForest": {
      "summary": "Short learning-area summary for Sound Forest (phonological awareness, letter-sound recognition, phoneme blending, auditory discrimination, spoken pronunciation). Note if insufficient or no data.",
      "strengths": [
        { "title": "Strength Title", "description": "Specific evidence description", "highlight": "Positive celebration" }
      ],
      "supportAreas": [
        { "title": "Support Area Title", "description": "Challenge observation", "explanationOfEvidence": "Attempts and accuracy context", "supportiveSuggestion": "Supportive strategy" }
      ],
      "practiceRecommendations": [
        "Actionable educational strategy 1", "Actionable educational strategy 2"
      ],
      "suggestedActivities": [
        "Sound Forest Round: focus description"
      ],
      "dataSufficiency": "sufficient | insufficient | no_data"
    },
    "visionValley": {
      "summary": "Short learning-area summary for Vision Valley (visual tracking, smooth pursuit, saccadic target acquisition, visual discrimination, visual-motor timing). Note if insufficient or no data.",
      "strengths": [ { "title": "...", "description": "...", "highlight": "..." } ],
      "supportAreas": [ { "title": "...", "description": "...", "explanationOfEvidence": "...", "supportiveSuggestion": "..." } ],
      "practiceRecommendations": [ "...", "..." ],
      "suggestedActivities": [ "..." ],
      "dataSufficiency": "sufficient | insufficient | no_data"
    },
    "storyCastle": {
      "summary": "Short learning-area summary for Story Castle (sight-word recognition, sentence decoding, reading fluency, story sequencing, reading comprehension). Note if insufficient or no data.",
      "strengths": [ { "title": "...", "description": "...", "highlight": "..." } ],
      "supportAreas": [ { "title": "...", "description": "...", "explanationOfEvidence": "...", "supportiveSuggestion": "..." } ],
      "practiceRecommendations": [ "...", "..." ],
      "suggestedActivities": [ "..." ],
      "dataSufficiency": "sufficient | insufficient | no_data"
    },
    "runeRealm": {
      "summary": "Short learning-area summary for Rune Realm (letter formation, number formation, fine-motor coordination, tracing precision, continuous stroke planning). Note if insufficient or no data.",
      "strengths": [ { "title": "...", "description": "...", "highlight": "..." } ],
      "supportAreas": [ { "title": "...", "description": "...", "explanationOfEvidence": "...", "supportiveSuggestion": "..." } ],
      "practiceRecommendations": [ "...", "..." ],
      "suggestedActivities": [ "..." ],
      "dataSufficiency": "sufficient | insufficient | no_data"
    },
    "memoryMountains": {
      "summary": "Short learning-area summary for Memory Mountains (visual working memory, object recall, sequential recall, pattern recognition, memory updating). Note if insufficient or no data.",
      "strengths": [ { "title": "...", "description": "...", "highlight": "..." } ],
      "supportAreas": [ { "title": "...", "description": "...", "explanationOfEvidence": "...", "supportiveSuggestion": "..." } ],
      "practiceRecommendations": [ "...", "..." ],
      "suggestedActivities": [ "..." ],
      "dataSufficiency": "sufficient | insufficient | no_data"
    }
  },
  "strengths": [
    { "domain": "domain name", "world": "world name", "description": "evidence description", "highlight": "encouraging highlight" }
  ],
  "practiceAreas": [
    { "domain": "domain name", "world": "world name", "description": "observation of challenge", "rationale": "why practice helps", "supportiveSuggestion": "educational strategy" }
  ],
  "progressObservations": [
    { "observation": "multi-session or task observation", "trend": "improving | steady | developing" }
  ],
  "recommendedActivities": [
    { "world": "one of soundForest, visionValley, storyCastle, runeRealm, memoryMountains", "activityTitle": "activity name", "focus": "skill focus", "encouragingNote": "friendly child-facing motivation" }
  ]
}`;

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
  };

  try {
    let activeModel = requestedModel;
    let url = `${GEMINI_API_BASE}/${activeModel}:generateContent?key=${apiKey}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    // If preferred model returns 404, fallback to secondary stable model
    if (!response.ok && activeModel !== FALLBACK_MODEL) {
      activeModel = FALLBACK_MODEL;
      url = `${GEMINI_API_BASE}/${activeModel}:generateContent?key=${apiKey}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });
    }

    if (!response.ok) {
      console.warn(`[Gemini API] Request returned HTTP status ${response.status}`);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API.');
    }

    const structuredInsights = JSON.parse(candidateText);

    res.statusCode = 200;
    res.end(JSON.stringify({
      source: 'gemini',
      engine: `Gemini (${activeModel})`,
      model: activeModel,
      notice: `Insights generated by Google Gemini (${activeModel}) under strict strengths-first, non-diagnostic educational guidelines.`,
      timestamp: new Date().toISOString(),
      data: structuredInsights,
    }));
  } catch (error) {
    console.warn('[LUMORA INSIGHT] Gemini request failed, using fallback engine:', error.message);
    const fallbackData = generateDeterministicFallback(sanitized.activities);
    res.statusCode = 200;
    res.end(JSON.stringify({
      source: 'fallback',
      engine: 'Rule-Based Deterministic Engine (Offline Fallback)',
      model: null,
      notice: 'Gemini service was temporarily unreachable. This report was generated by Lumora’s built-in rule-based learning insights engine.',
      error: error.message,
      timestamp: new Date().toISOString(),
      data: fallbackData,
    }));
  }
}

export {
  sanitizePayload,
  sanitizePseudonym,
  sanitizeAgeBand,
  sanitizePerspectiveRole,
  sanitizeDomain,
  sanitizeActivityName,
  getClientIp,
  checkRateLimit,
  generateDeterministicFallback,
  ALLOWED_WORLDS,
  ALLOWED_DOMAINS,
  ALLOWED_AGE_BANDS,
  ALLOWED_PERSPECTIVE_ROLES,
  APPROVED_ROUND_TITLES,
};
