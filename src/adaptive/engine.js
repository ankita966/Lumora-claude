// Lightweight adaptive learning engine.
// IMPORTANT: scores describe practice performance only. They are never a
// diagnosis of dyslexia, dysgraphia, dyscalculia or any other condition.

export const SKILLS = {
  sound: { label: 'Sound', world: 'soundForest' },
  vision: { label: 'Vision', world: 'visionValley' },
  reading: { label: 'Reading', world: 'storyCastle' },
  motor: { label: 'Motor/Tracing', world: 'runeRealm' },
  numberSense: { label: 'Number Sense', world: 'memoryMountains' },
  memory: { label: 'Memory', world: 'memoryMountains' },
};

// Recommended next-step copy per skill, used when that skill is the weakest.
const RECOMMENDATIONS = {
  sound: 'Sound needs more practice → Recommended: Sound Forest, Sound Match round.',
  vision: 'Visual tracking needs more practice → Recommended: Vision Valley, Track & Touch round.',
  reading: 'Reading needs more practice → Recommended: Story Castle, Level 2 passage.',
  motor: 'Tracing control needs more practice → Recommended: Rune Realm, Shape Tracing round.',
  numberSense: 'Number sense needs more practice → Recommended: Memory Mountains, Remember Objects round.',
  memory: 'Visual memory needs more practice → Recommended: Memory Mountains, Memory Master Challenge.',
};

/**
 * activityLog entries: { world, round, skill, accuracy (0-1), attempts, timeMs, ts }
 * Returns a 0-100 score per skill using a recency-weighted average, so recent
 * rounds count more than old ones but a single bad round can't tank the score.
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
      profile[key] = null; // not enough data yet
      continue;
    }
    let weightedSum = 0;
    let weightTotal = 0;
    entries.forEach((entry, i) => {
      // more recent entries (later in array) get more weight
      const weight = 1 + i * 0.35;
      // attempts penalty: needing many attempts slightly lowers effective score
      const attemptFactor = Math.max(0.7, 1 - (Math.max(0, entry.attempts - 1) * 0.06));
      weightedSum += entry.accuracy * attemptFactor * weight;
      weightTotal += weight;
    });
    profile[key] = Math.round((weightedSum / weightTotal) * 100);
  }
  return profile;
}

export function recommendNextActivity(profile) {
  const scored = Object.entries(profile).filter(([, v]) => v !== null);
  if (scored.length === 0) {
    return {
      skill: null,
      message: 'Play a few rounds in any world to unlock a personalized recommendation!',
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

// Demo data for the Specialist dashboard — clearly synthetic, never real children.
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
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
