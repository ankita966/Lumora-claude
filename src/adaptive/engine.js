// Adaptive Learning Engine.
// Calibrated Bayesian recency weighting for skill mastery tracking.
// IMPORTANT: Scores describe practice performance and learning progress.

export const SKILLS = {
  sound: { label: 'Sound', world: 'soundForest', icon: '🌲' },
  vision: { label: 'Vision', world: 'visionValley', icon: '👁️' },
  reading: { label: 'Reading', world: 'storyCastle', icon: '🏰' },
  motor: { label: 'Motor/Tracing', world: 'runeRealm', icon: '✨' },
  numberSense: { label: 'Number Sense', world: 'memoryMountains', icon: '🔢' },
  memory: { label: 'Memory', world: 'memoryMountains', icon: '🧠' },
};

const RECOMMENDATIONS = {
  sound: 'Phonological awareness practice → Recommended: Sound Forest (Sound Match).',
  vision: 'Visual tracking and saccadic control → Recommended: Vision Valley (Track & Touch).',
  reading: 'Reading fluency and word decoding → Recommended: Story Castle (Reading Passage).',
  motor: 'Fine motor kinematics & stroke control → Recommended: Rune Realm (Shape Tracing).',
  numberSense: 'Spatial numeracy & pattern recognition → Recommended: Memory Mountains (Object Count).',
  memory: 'Working memory & visual sequencing → Recommended: Memory Mountains (Memory Master).',
};

/**
 * Bayesian-weighted profile computation.
 * Combines an uninformative prior with recency-decayed observed evidence.
 */
export function computeProfile(activityLog) {
  const bySkill = {};
  for (const key of Object.keys(SKILLS)) bySkill[key] = [];

  for (const entry of activityLog) {
    if (bySkill[entry.skill]) bySkill[entry.skill].push(entry);
  }

  const profile = {};
  for (const key of Object.keys(SKILLS)) {
    const entries = bySkill[key];
    if (entries.length === 0) {
      profile[key] = null;
      continue;
    }

    // Bayesian prior: prior mean = 50, prior weight = 1.0
    let weightedSum = 50.0;
    let weightTotal = 1.0;

    entries.forEach((entry, i) => {
      // Recency weight: exponential growth factor per subsequent attempt
      const recencyWeight = Math.min(3.5, 1.0 + Math.pow(i, 0.65) * 0.4);
      
      // Attempt efficiency factor
      const attemptPenalty = Math.max(0.65, 1.0 - Math.max(0, entry.attempts - 1) * 0.08);
      
      // Time efficiency bonus (if < 15s, slight boost)
      const timeBonus = entry.timeMs && entry.timeMs < 15000 ? 1.05 : 1.0;
      
      const normalizedScore = entry.accuracy * 100 * attemptPenalty * timeBonus;
      weightedSum += Math.min(100, Math.max(0, normalizedScore)) * recencyWeight;
      weightTotal += recencyWeight;
    });

    profile[key] = Math.round(Math.min(100, Math.max(10, weightedSum / weightTotal)));
  }
  return profile;
}

export function recommendNextActivity(profile) {
  const scored = Object.entries(profile).filter(([, v]) => v !== null);
  if (scored.length === 0) {
    return {
      skill: null,
      message: 'Play a few rounds in any world to unlock personalized guidance!',
    };
  }
  scored.sort((a, b) => a[1] - b[1]);
  const [weakestSkill, score] = scored[0];
  return {
    skill: weakestSkill,
    score,
    message: RECOMMENDATIONS[weakestSkill],
  };
}

export function skillLabel(key) {
  return SKILLS[key]?.label ?? key;
}

// Synthetic demo profiles for specialist dashboard
export function buildDemoProfile(seed) {
  const rand = mulberry32(seed);
  const profile = {};
  for (const key of Object.keys(SKILLS)) {
    profile[key] = Math.round(45 + rand() * 50);
  }
  return profile;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
