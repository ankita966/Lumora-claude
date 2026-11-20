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
const FALLBACK_MODEL = 'gemini-2.0-flash';

/**
 * System instruction enforcing strengths-first educational insights
 * and an absolute non-diagnostic mandate.
 */
const SYSTEM_INSTRUCTION = `You are LUMORA INSIGHT, an empathetic, supportive educational AI assistant for Lumora World (a playful learning platform for children aged 3–11 across 5 learning worlds: Sound Forest, Vision Valley, Story Castle, Rune Realm, and Memory Mountains).

YOUR CRITICAL RULES:
1. STRICT NON-DIAGNOSTIC MANDATE: NEVER diagnose, predict, or evaluate medical, cognitive, psychological, or neurological disorders (such as ADHD, dyslexia, dysgraphia, dyscalculia, or autism). NEVER assign risk scores, condition rankings, or disease probabilities.
2. STRENGTHS-FIRST, ASSET-BASED LANGUAGE: Celebrate persistence, effort, and what the child does well. Avoid deficit framing or clinical jargon.
3. GROUNDED IN EVIDENCE ONLY: Base every observation strictly on the provided pseudonymised gameplay activity data (accuracy, attempts, duration, and completion). Do not invent unmeasured difficulties.
4. PRACTICAL EDUCATIONAL RECOMMENDATIONS: Provide encouraging, actionable next activities in Lumora's five worlds (Sound Forest, Story Castle, Rune Realm, Memory Mountains, Vision Valley).
5. RETURN VALID JSON ONLY adhering exactly to the requested JSON schema.`;

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

  for (const [world, rounds] of Object.entries(byWorld)) {
    const worldAvg = rounds.reduce((s, r) => s + (Number(r.accuracy) || 0), 0) / rounds.length;
    const worldAttempts = rounds.reduce((s, r) => s + (Number(r.attempts) || 1), 0) / rounds.length;

    if (worldAvg >= 0.75) {
      strengthsList.push({
        world,
        domain: rounds[0]?.domain || world,
        description: `Consistently high engagement across ${rounds.length} completed round(s) with an average of ${Math.round(worldAvg * 100)}% accuracy.`,
        highlight: 'Confident pacing and strong task completion.',
      });
    } else if (worldAvg < 0.7 || worldAttempts >= 2) {
      practiceList.push({
        world,
        domain: rounds[0]?.domain || world,
        description: `Encountered multi-attempt challenges (${rounds.length} rounds logged, averaging ${Math.round(worldAvg * 100)}% accuracy).`,
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
      ? `The learner has completed ${totalRounds} activity round(s) across ${Object.keys(byWorld).length} learning realm(s) with an overall accuracy of ${avgAccuracy}%. The recorded data shows enthusiastic effort, particularly in structured, step-by-step challenges.`
      : 'No activity data recorded yet. Starting short playful sessions in any of the 5 realms will unlock evidence-based insights.',
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

/**
 * Strips any potential identifying user info from payload.
 */
function sanitizePayload(raw) {
  if (!raw || typeof raw !== 'object') return { pseudonym: 'learner_anon', activities: [] };

  const activities = (Array.isArray(raw.activities) ? raw.activities : [])
    .slice(0, 50)
    .map((item, idx) => ({
      index: idx + 1,
      world: String(item.world || 'unknown').slice(0, 32),
      round: Number(item.round) || 1,
      activity: String(item.activity || item.title || `Round ${item.round || 1}`).slice(0, 64),
      domain: String(item.domain || item.skill || 'general').slice(0, 48),
      accuracy: Math.max(0, Math.min(1, Number(item.accuracy) || 0)),
      attempts: Math.max(1, Math.min(20, Number(item.attempts) || 1)),
      duration_seconds: Math.max(1, Math.min(3600, Math.round((Number(item.timeMs) || Number(item.durationMs) || 10000) / 1000))),
      hints: Math.max(0, Math.min(10, Number(item.hints) || 0)),
      completion_status: item.completion_status === 'completed' || item.completed !== false ? 'completed' : 'in-progress',
    }));

  return {
    pseudonym: `learner_${String(raw.pseudonym || 'explorer').slice(0, 16).replace(/[^a-zA-Z0-9_]/g, '')}`,
    ageBand: String(raw.ageBand || 'Primary (Ages 5-11)').slice(0, 32),
    activities,
  };
}

/**
 * Main request handler.
 * Compatible with Vercel Serverless Functions and Node Connect/Express middleware.
 */
export default async function handler(req, res) {
  // CORS & Header preparation
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

  // Parse incoming body if needed
  let body = req.body;
  if (!body && typeof req.on === 'function') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const text = Buffer.concat(chunks).toString('utf8');
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
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
  const promptText = `Analyze the following pseudonymised gameplay activities recorded in Lumora World for ${sanitized.pseudonym} (${sanitized.ageBand}).

Recorded Activity Records:
${JSON.stringify(sanitized.activities, null, 2)}

Provide strengths-first learning insights in structured JSON matching this schema:
{
  "summary": "2-3 sentences summarizing engagement, resilience, and general patterns without clinical diagnosis.",
  "strengths": [
    { "domain": "domain name", "world": "world name", "description": "evidence description", "highlight": "encouraging highlight" }
  ],
  "practiceAreas": [
    { "domain": "domain name", "world": "world name", "description": "observation of challenge", "rationale": "why practice helps", "supportiveSuggestion": "educational home or classroom strategy" }
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
      maxOutputTokens: 1400,
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
      const errorText = await response.text();
      console.warn(`[Gemini API] Request failed with HTTP ${response.status}: ${errorText.slice(0, 200)}`);
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

