import React, { useMemo, useState } from 'react';
import { WORLD_ORDER, WORLDS } from '../data/worlds';
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
    subtitle: 'Reading and language-processing difference',
    relevantDomains: ['phonological', 'reading'],
    worldConnection: 'Sound Forest (letter-sound & blending) & Story Castle (decoding & fluency)',
    definition: 'Dyslexia is a learning difference primarily associated with difficulties in accurate and fluent word reading, phonological processing, and decoding. It involves how the brain processes written and spoken language sounds.',
    notIntelligence: 'Dyslexia is completely unrelated to general intelligence. Individuals with dyslexia frequently exhibit exceptional strengths in spatial reasoning, big-picture thinking, creative problem-solving, narrative storytelling, and artistic expression.',
    gameplayDistinction: 'A lower score or repeated attempt in Lumora reading activities (such as Missing Word or Read Aloud) is NOT evidence of dyslexia. Gameplay results can be influenced by microphone input levels, reading speed preferences, device familiarity, visual fatigue, or unfamiliar vocabulary.',
    classroomSuggestions: [
      'Provide structured, explicit, and systematic phonics instruction.',
      'Allow extra time for reading comprehension and oral reading tasks.',
      'Provide audiobooks or text-to-speech tools to support access to grade-level content.',
      'Use multi-sensory techniques (visual word cards, letter tiles, tactile materials).',
    ],
    homeSuggestions: [
      'Practice short (10–15 minute) paired shared reading sessions daily without pressure.',
      'Play oral word and rhyme games during commutes or household routines.',
      'Celebrate reading effort and stamina rather than reading speed.',
      'Provide access to graphic novels, high-interest illustrated books, and audiobooks.',
    ],
    studentMessage: 'Great readers take their time exploring words! Exploring stories with Phono in Sound Forest and Luna in Story Castle helps your reading muscles grow stronger every day.',
  },
  dysgraphia: {
    name: 'Dysgraphia',
    subtitle: 'Written expression and motor-coordination difference',
    relevantDomains: ['writing_motor'],
    worldConnection: 'Rune Realm (letter tracing, stroke sequencing & waypoint following)',
    definition: 'Dysgraphia is a learning difference characterized by difficulties with written expression, handwriting mechanics, and fine motor coordination related to writing. It may affect letter formation, spacing, stroke consistency, or the motor planning needed to translate thoughts into written text.',
    notIntelligence: 'Dysgraphia has no connection to intelligence or cognitive ability. Students with dysgraphia often have rich vocabularies, deep conceptual understanding, and sophisticated verbal communication skills that far exceed what is reflected in their handwriting.',
    gameplayDistinction: 'Tracing difficulties in Rune Realm do NOT indicate dysgraphia. Hand-tracking camera sensitivity, ambient room lighting, mouse calibration, touchscreen responsiveness, and finger fatigue significantly affect in-game tracing accuracy.',
    classroomSuggestions: [
      'Allow keyboarding, speech-to-text, or oral explanations as alternative ways to demonstrate understanding.',
      'Provide pre-printed notes, graphic organizers, or fill-in-the-blank outlines.',
      'Offer ergonomic pencil grips, slanted writing surfaces, or wide-ruled paper.',
      'Grade assignments for intellectual content and ideas separately from handwriting neatness.',
    ],
    homeSuggestions: [
      'Engage in fun fine-motor activities: clay modeling, bead threading, mazes, and origami.',
      'Practice large letter formation in sensory materials (finger-tracing in salt trays or shaving cream).',
      'Encourage voice recording of creative stories before writing or typing them down.',
      'Keep handwriting practice brief and focused on positive letter shapes.',
    ],
    studentMessage: 'Drawing magical runes takes steady patience! In Rune Realm, you can move your hand at whatever speed feels comfortable to awaken each glowing star.',
  },
  dyscalculia: {
    name: 'Dyscalculia',
    subtitle: 'Number sense and mathematical reasoning difference',
    relevantDomains: ['math_number'],
    worldConnection: 'Memory Mountains (Round 4: Follow the Pattern) & Rune Realm (Round 3: Number Tracing)',
    definition: 'Dyscalculia is a learning difference that affects a person’s ability to understand numbers, learn mathematical facts, grasp number sense, and perform mathematical calculations and sequential quantitative reasoning.',
    notIntelligence: 'Dyscalculia is completely separate from cognitive ability. Learners with dyscalculia often demonstrate remarkable strengths in language arts, visual arts, design, empathy, and intuitive problem-solving.',
    gameplayDistinction: 'Making multiple attempts on Lumora pattern matching or number tracing does NOT mean a child has dyscalculia. Pattern games also test visual memory, attention span, and rapid decision-making.',
    classroomSuggestions: [
      'Use concrete manipulatives (counting cubes, ten-frames, bead strings, physical counters).',
      'Provide visual number lines and math reference sheets during problem-solving.',
      'Break multi-step math tasks into clear, sequential single-step instructions.',
      'Connect abstract numbers to concrete, visual real-life scenarios (cooking, measurement).',
    ],
    homeSuggestions: [
      'Play dice games, dominoes, and board games that involve counting spaces and matching patterns.',
      'Cook together, measuring ingredients with measuring cups and spoons.',
      'Sort household items (socks, coins, colored buttons) and talk about patterns.',
      'Focus praise on problem-solving strategies rather than quick mental calculation.',
    ],
    studentMessage: 'Numbers and patterns are like secret puzzles! In Memory Mountains, every pattern you solve helps you discover hidden mountain secrets.',
  },
};

/**
 * Rich realistic sample learners for demonstration and evaluation
 * when running offline or without an active Supabase connection.
 */
export const SAMPLE_LEARNERS = [
  {
    id: 'sample-alex',
    displayName: 'Alex Rivera',
    grade: 'Grade 3',
    xp: 18450,
    sessionsCompleted: 6,
    totalTimeMs: 1000 * 60 * 54, // 54 mins
    worldsCompleted: { soundForest: true, visionValley: true, storyCastle: true, runeRealm: true, memoryMountains: true },
    sessionLog: [
      { id: 'sess-1', world: 'soundForest', startedAt: Date.now() - 86400000 * 5, completedAt: Date.now() - 86400000 * 5 + 600000 },
      { id: 'sess-2', world: 'storyCastle', startedAt: Date.now() - 86400000 * 4, completedAt: Date.now() - 86400000 * 4 + 720000 },
      { id: 'sess-3', world: 'runeRealm', startedAt: Date.now() - 86400000 * 3, completedAt: Date.now() - 86400000 * 3 + 550000 },
      { id: 'sess-4', world: 'memoryMountains', startedAt: Date.now() - 86400000 * 2, completedAt: Date.now() - 86400000 * 2 + 650000 },
      { id: 'sess-5', world: 'visionValley', startedAt: Date.now() - 86400000 * 1, completedAt: Date.now() - 86400000 * 1 + 500000 },
      { id: 'sess-6', world: 'storyCastle', startedAt: Date.now() - 14400000, completedAt: Date.now() - 13800000 },
    ],
    activityLog: [
      // Sound Forest (phonological)
      { world: 'soundForest', round: 1, skill: 'sound', accuracy: 0.95, attempts: 1, timeMs: 14200, sessionId: 'sess-1', ts: Date.now() - 86400000 * 5 },
      { world: 'soundForest', round: 2, skill: 'sound', accuracy: 0.90, attempts: 1, timeMs: 16500, sessionId: 'sess-1', ts: Date.now() - 86400000 * 5 + 30000 },
      { world: 'soundForest', round: 3, skill: 'sound', accuracy: 0.85, attempts: 2, timeMs: 22000, sessionId: 'sess-1', ts: Date.now() - 86400000 * 5 + 65000 },
      { world: 'soundForest', round: 4, skill: 'sound', accuracy: 0.80, attempts: 2, timeMs: 19500, sessionId: 'sess-1', ts: Date.now() - 86400000 * 5 + 95000 },
      { world: 'soundForest', round: 5, skill: 'sound', accuracy: 0.90, attempts: 1, timeMs: 15000, sessionId: 'sess-1', ts: Date.now() - 86400000 * 5 + 130000 },

      // Story Castle session 1 (reading)
      { world: 'storyCastle', round: 1, skill: 'reading', accuracy: 0.85, attempts: 1, timeMs: 18000, sessionId: 'sess-2', ts: Date.now() - 86400000 * 4 },
      { world: 'storyCastle', round: 2, skill: 'reading', accuracy: 0.60, attempts: 3, timeMs: 34000, sessionId: 'sess-2', ts: Date.now() - 86400000 * 4 + 40000 },
      { world: 'storyCastle', round: 3, skill: 'reading', accuracy: 0.55, attempts: 3, timeMs: 38000, sessionId: 'sess-2', ts: Date.now() - 86400000 * 4 + 85000 },
      { world: 'storyCastle', round: 4, skill: 'reading', accuracy: 0.80, attempts: 1, timeMs: 21000, sessionId: 'sess-2', ts: Date.now() - 86400000 * 4 + 130000 },
      { world: 'storyCastle', round: 5, skill: 'reading', accuracy: 0.75, attempts: 2, timeMs: 26000, sessionId: 'sess-2', ts: Date.now() - 86400000 * 4 + 165000 },

      // Rune Realm (writing_motor)
      { world: 'runeRealm', round: 1, skill: 'motor', accuracy: 0.90, attempts: 1, timeMs: 14000, sessionId: 'sess-3', ts: Date.now() - 86400000 * 3 },
      { world: 'runeRealm', round: 2, skill: 'motor', accuracy: 0.62, attempts: 3, timeMs: 31000, sessionId: 'sess-3', ts: Date.now() - 86400000 * 3 + 35000 },
      { world: 'runeRealm', round: 3, skill: 'motor', accuracy: 0.70, attempts: 2, timeMs: 28000, sessionId: 'sess-3', ts: Date.now() - 86400000 * 3 + 70000 },
      { world: 'runeRealm', round: 4, skill: 'motor', accuracy: 0.85, attempts: 1, timeMs: 22000, sessionId: 'sess-3', ts: Date.now() - 86400000 * 3 + 105000 },
      { world: 'runeRealm', round: 5, skill: 'motor', accuracy: 0.80, attempts: 2, timeMs: 26000, sessionId: 'sess-3', ts: Date.now() - 86400000 * 3 + 140000 },

      // Memory Mountains (memory & numberSense)
      { world: 'memoryMountains', round: 1, skill: 'memory', accuracy: 0.92, attempts: 1, timeMs: 16000, sessionId: 'sess-4', ts: Date.now() - 86400000 * 2 },
      { world: 'memoryMountains', round: 2, skill: 'memory', accuracy: 0.88, attempts: 1, timeMs: 17500, sessionId: 'sess-4', ts: Date.now() - 86400000 * 2 + 30000 },
      { world: 'memoryMountains', round: 3, skill: 'memory', accuracy: 0.85, attempts: 1, timeMs: 21000, sessionId: 'sess-4', ts: Date.now() - 86400000 * 2 + 65000 },
      { world: 'memoryMountains', round: 4, skill: 'numberSense', accuracy: 0.64, attempts: 3, timeMs: 35000, sessionId: 'sess-4', ts: Date.now() - 86400000 * 2 + 100000 },
      { world: 'memoryMountains', round: 5, skill: 'memory', accuracy: 0.80, attempts: 2, timeMs: 29000, sessionId: 'sess-4', ts: Date.now() - 86400000 * 2 + 145000 },

      // Vision Valley (vision)
      { world: 'visionValley', round: 1, skill: 'vision', accuracy: 0.94, attempts: 1, timeMs: 13000, sessionId: 'sess-5', ts: Date.now() - 86400000 * 1 },
      { world: 'visionValley', round: 2, skill: 'vision', accuracy: 0.90, attempts: 1, timeMs: 14500, sessionId: 'sess-5', ts: Date.now() - 86400000 * 1 + 25000 },
      { world: 'visionValley', round: 3, skill: 'vision', accuracy: 0.88, attempts: 1, timeMs: 16000, sessionId: 'sess-5', ts: Date.now() - 86400000 * 1 + 55000 },
      { world: 'visionValley', round: 4, skill: 'vision', accuracy: 0.92, attempts: 1, timeMs: 15500, sessionId: 'sess-5', ts: Date.now() - 86400000 * 1 + 80000 },
      { world: 'visionValley', round: 5, skill: 'vision', accuracy: 0.86, attempts: 2, timeMs: 21000, sessionId: 'sess-5', ts: Date.now() - 86400000 * 1 + 110000 },

      // Story Castle session 2 (reading progress)
      { world: 'storyCastle', round: 1, skill: 'reading', accuracy: 0.92, attempts: 1, timeMs: 16000, sessionId: 'sess-6', ts: Date.now() - 14400000 },
      { world: 'storyCastle', round: 2, skill: 'reading', accuracy: 0.72, attempts: 2, timeMs: 27000, sessionId: 'sess-6', ts: Date.now() - 14400000 + 35000 },
      { world: 'storyCastle', round: 3, skill: 'reading', accuracy: 0.68, attempts: 2, timeMs: 31000, sessionId: 'sess-6', ts: Date.now() - 14400000 + 75000 },
      { world: 'storyCastle', round: 4, skill: 'reading', accuracy: 0.88, attempts: 1, timeMs: 18000, sessionId: 'sess-6', ts: Date.now() - 14400000 + 115000 },
      { world: 'storyCastle', round: 5, skill: 'reading', accuracy: 0.85, attempts: 1, timeMs: 22000, sessionId: 'sess-6', ts: Date.now() - 14400000 + 150000 },
    ],
  },
  {
    id: 'sample-maya',
    displayName: 'Maya Chen',
    grade: 'Grade 2',
    xp: 14200,
    sessionsCompleted: 4,
    totalTimeMs: 1000 * 60 * 36,
    worldsCompleted: { soundForest: true, storyCastle: true, runeRealm: true },
    sessionLog: [
      { id: 'sess-m1', world: 'soundForest', startedAt: Date.now() - 86400000 * 3, completedAt: Date.now() - 86400000 * 3 + 550000 },
      { id: 'sess-m2', world: 'storyCastle', startedAt: Date.now() - 86400000 * 2, completedAt: Date.now() - 86400000 * 2 + 600000 },
      { id: 'sess-m3', world: 'runeRealm', startedAt: Date.now() - 86400000 * 1, completedAt: Date.now() - 86400000 * 1 + 500000 },
    ],
    activityLog: [
      { world: 'soundForest', round: 1, skill: 'sound', accuracy: 0.90, attempts: 1, timeMs: 15000, sessionId: 'sess-m1', ts: Date.now() - 86400000 * 3 },
      { world: 'soundForest', round: 2, skill: 'sound', accuracy: 0.85, attempts: 1, timeMs: 17000, sessionId: 'sess-m1', ts: Date.now() - 86400000 * 3 + 30000 },
      { world: 'soundForest', round: 3, skill: 'sound', accuracy: 0.60, attempts: 3, timeMs: 29000, sessionId: 'sess-m1', ts: Date.now() - 86400000 * 3 + 60000 },
      { world: 'soundForest', round: 4, skill: 'sound', accuracy: 0.65, attempts: 2, timeMs: 24000, sessionId: 'sess-m1', ts: Date.now() - 86400000 * 3 + 90000 },
      { world: 'soundForest', round: 5, skill: 'sound', accuracy: 0.75, attempts: 2, timeMs: 21000, sessionId: 'sess-m1', ts: Date.now() - 86400000 * 3 + 120000 },
      { world: 'storyCastle', round: 1, skill: 'reading', accuracy: 0.80, attempts: 1, timeMs: 18000, sessionId: 'sess-m2', ts: Date.now() - 86400000 * 2 },
      { world: 'storyCastle', round: 2, skill: 'reading', accuracy: 0.58, attempts: 3, timeMs: 36000, sessionId: 'sess-m2', ts: Date.now() - 86400000 * 2 + 40000 },
      { world: 'runeRealm', round: 1, skill: 'motor', accuracy: 0.88, attempts: 1, timeMs: 15000, sessionId: 'sess-m3', ts: Date.now() - 86400000 * 1 },
      { world: 'runeRealm', round: 2, skill: 'motor', accuracy: 0.82, attempts: 1, timeMs: 18000, sessionId: 'sess-m3', ts: Date.now() - 86400000 * 1 + 35000 },
    ],
  },
];

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
      const sample = items[0];
      const worldDef = WORLD_ROUNDS[sample.world]?.find((r) => r.round === sample.round);
      const rAvgAcc = items.reduce((s, i) => s + i.accuracy, 0) / items.length;
      const rTotalAttempts = items.reduce((s, i) => s + (i.attempts || 1), 0);
      return {
        key,
        worldKey: sample.world,
        worldName: WORLDS[sample.world]?.name ?? sample.world,
        round: sample.round,
        title: worldDef?.title || `Round ${sample.round}`,
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
  onSelectSampleLearner,
}) {
  const [selectedWorld, setSelectedWorld] = useState('all');
  const [activePerspective, setActivePerspective] = useState(role);
  const [sampleLearnerIndex, setSampleLearnerIndex] = useState(0);

  // If no learner is passed (e.g., demo/unconfigured environment), use sample learner for rich evaluation
  const effectiveLearner = learner || SAMPLE_LEARNERS[sampleLearnerIndex];
  const isSamplePreview = !learner;

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
      {/* Sample learner banner if in evaluation/preview mode */}
      {isSamplePreview && (
        <div className="insights-sample-banner" role="status">
          <span className="insights-sample-badge">DEMO / PREVIEW MODE</span>
          <span>Showing authentic sample student data ({effectiveLearner.displayName}). Switch sample learner: </span>
          <div className="insights-sample-toggle">
            {SAMPLE_LEARNERS.map((sample, idx) => (
              <button
                key={sample.id}
                type="button"
                className={`insights-chip-btn ${sampleLearnerIndex === idx ? 'active' : ''}`}
                onClick={() => setSampleLearnerIndex(idx)}
              >
                {sample.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

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

        <div className="insights-education-callout">
          <div className="insights-callout-header">
            <span className="insights-callout-icon" aria-hidden="true">💡</span>
            <h4>Essential Understanding for Families and Educators</h4>
          </div>
          <p>
            Learning differences are <strong>variations in brain wiring</strong>, not deficits in intelligence, effort, or potential.
            Many of history’s greatest scientists, writers, artists, and leaders navigated dyslexia, dysgraphia, or dyscalculia.
          </p>
          <p className="insights-callout-note">
            <strong>Clear Distinction:</strong> The explanations below provide <em>general educational information</em> to empower collaborative conversations.
            They are shown here <strong>only because Lumora recorded activity in the corresponding learning domain</strong>.
            Lumora <strong>does not calculate disease probabilities, assign risk scores, rank conditions, or establish any diagnosis</strong>.
            If learning struggles persist across multiple school and home environments, consider an evaluation by an appropriately qualified professional.
          </p>
        </div>

        {relevantConditions.length > 0 ? (
          <div className="insights-conditions-grid">
            {relevantConditions.map((cond) => (
              <div key={cond.key} className="insights-condition-card">
                <div className="insights-cond-header">
                  <div>
                    <h4 className="insights-cond-name">{cond.name}</h4>
                    <span className="insights-cond-sub">{cond.subtitle}</span>
                  </div>
                  <span className="insights-cond-tag">Domain: {cond.worldConnection.split('(')[0].trim()}</span>
                </div>

                <div className="insights-cond-body">
                  <div className="insights-cond-block">
                    <span className="cond-lbl">What It Is:</span>
                    <p>{cond.definition}</p>
                  </div>

                  <div className="insights-cond-block">
                    <span className="cond-lbl">Intelligence & Strengths:</span>
                    <p>{cond.notIntelligence}</p>
                  </div>

                  <div className="insights-cond-block warning">
                    <span className="cond-lbl">How It Differs From Lumora Gameplay:</span>
                    <p>{cond.gameplayDistinction}</p>
                  </div>

                  {/* Context-aware suggestions depending on active perspective */}
                  <div className="insights-cond-suggestions">
                    {activePerspective === 'teacher' && (
                      <div className="cond-role-box">
                        <span className="role-tag">🍎 Classroom Strategies:</span>
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
                        <span className="role-tag">🔬 Collaborative & Structured Accommodations:</span>
                        <ul>
                          {cond.classroomSuggestions.slice(0, 2).map((s, idx) => <li key={idx}>Classroom: {s}</li>)}
                          {cond.homeSuggestions.slice(0, 2).map((s, idx) => <li key={`h-${idx}`}>Home: {s}</li>)}
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
          Evidence-based suggestions grounded in the specific recorded domains where practice was logged.
          These recommendations are <strong>educational strategies, not clinical treatment plans</strong>.
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
                  <strong>Pacing & Micro-Steps:</strong>
                  <p>Break complex multi-step instructions into clear, bite-sized tasks. Allow natural pauses between activities.</p>
                </div>
                <div className="rec-col">
                  <strong>Effort & Process Praise:</strong>
                  <p>Acknowledge persistence, creative strategies, and resilience rather than pure speed or instant accuracy.</p>
                </div>
                <div className="rec-col">
                  <strong>Rest & Brain Breaks:</strong>
                  <p>Schedule 5-minute movement breaks between focused learning blocks to refresh attention and prevent visual fatigue.</p>
                </div>
                <div className="rec-col">
                  <strong>Progress Over Time:</strong>
                  <p>Review the student’s growth over weeks rather than judging single sessions. Celebrate small milestones together.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Domain-Specific Next Steps based on Actual Growth Areas */}
          {overallGrowthAreas.length > 0 ? (
            <div className="insights-domain-recs-list">
              <h4 className="recs-subheading">Domain-Specific Educational Strategies:</h4>
              {overallGrowthAreas.map((item) => (
                <div key={item.key} className="insights-rec-card targeted">
                  <div className="rec-card-header">
                    <span className="rec-icon" aria-hidden="true">🎯</span>
                    <div>
                      <h4>Targeted Practice: {item.title} ({item.worldName})</h4>
                      <span className="rec-sub">
                        Observed evidence: {item.totalAttempts} attempts across {item.count} round{item.count === 1 ? '' : 's'} (avg accuracy {Math.round(item.avgAccuracy * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="rec-card-body">
                    <p className="rec-rationale">
                      <strong>Why this is suggested:</strong> The learner experienced multiple attempts on {item.title} ({item.description}).
                      Gentle, scaffolded practice in this area can build confidence.
                    </p>

                    <div className="rec-role-suggestions">
                      {activePerspective === 'teacher' && (
                        <div className="role-suggestion-block">
                          <strong>🍎 Teacher Classroom Strategy:</strong>
                          <p>
                            {item.worldKey === 'soundForest' && 'Introduce structured phoneme-blending with physical counters or Elkonin sound boxes before reading tasks.'}
                            {item.worldKey === 'storyCastle' && 'Pre-teach key vocabulary before passage reading. Allow paired or whisper reading with a peer buddy.'}
                            {item.worldKey === 'runeRealm' && 'Offer pencil grips or raised-line tracing sheets. Allow verbal or typed alternatives to reduce handwriting strain.'}
                            {item.worldKey === 'memoryMountains' && 'Provide visual checklists and graphic organizers to decrease working memory load during problem solving.'}
                            {item.worldKey === 'visionValley' && 'Check lighting and screen positioning. Provide high-contrast reading guides or physical trackers.'}
                          </p>
                        </div>
                      )}

                      {activePerspective === 'parent' && (
                        <div className="role-suggestion-block">
                          <strong>👪 Parent Home Suggestion:</strong>
                          <p>
                            {item.worldKey === 'soundForest' && 'Play silly sound blending games during dinner or car rides (e.g., "Can you guess what word is /s/ /u/ /n/?").'}
                            {item.worldKey === 'storyCastle' && 'Read favorite books together using echo reading: you read a sentence aloud, and your child reads it back.'}
                            {item.worldKey === 'runeRealm' && 'Trace letters in salt trays, draw in sidewalk chalk, or play with modeling clay to strengthen finger muscles playfully.'}
                            {item.worldKey === 'memoryMountains' && 'Play sequence memory games like "I went to the market and bought..." keeping it light and fun.'}
                            {item.worldKey === 'visionValley' && 'Play "I Spy" games in picture books or spot-the-difference puzzles during quiet time.'}
                          </p>
                        </div>
                      )}

                      {(activePerspective === 'specialist' || activePerspective === 'school_admin') && (
                        <div className="role-suggestion-block">
                          <strong>🔬 Specialist / Administrator Action Plan:</strong>
                          <p>
                            Record multi-session observations over 4–6 weeks. Correlate with classroom observation data.
                            Coordinate between home and school to ensure consistent multisensory accommodations without stigmatization.
                          </p>
                        </div>
                      )}

                      {activePerspective === 'student' && (
                        <div className="role-suggestion-block student">
                          <strong>⭐ Your Next Quest:</strong>
                          <p>
                            Ready for another magical adventure? Try a short quest in {item.worldName}!
                            Remember: take all the time you need, and celebrate every single step!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
