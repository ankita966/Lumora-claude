import assert from 'node:assert/strict';
import http from 'node:http';
import {
  sanitizePayload,
  sanitizePseudonym,
  sanitizeAgeBand,
  sanitizePerspectiveRole,
  sanitizeDomain,
  sanitizeActivityName,
  getClientIp,
  checkRateLimit,
  ALLOWED_WORLDS,
  ALLOWED_DOMAINS,
  ALLOWED_AGE_BANDS,
  ALLOWED_PERSPECTIVE_ROLES,
} from '/Users/ankitajethani/Downloads/Lumora-claude-main/api/insights.js';
import handler from '/Users/ankitajethani/Downloads/Lumora-claude-main/api/insights.js';

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

async function itAsync(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

console.log('\n=== SUITE 1: Invalid World Names Validation ===');

it('Invalid world names are discarded and never become soundForest', () => {
  const payload = {
    pseudonym: 'learner_8f3a12',
    activities: [
      { world: 'fakeWorld', round: 1, accuracy: 0.9 },
      { world: 'marsExploration', round: 2, accuracy: 0.8 },
      { world: '', round: 3, accuracy: 0.7 },
      { world: null, round: 4, accuracy: 0.6 },
      { world: 12345, round: 5, accuracy: 0.5 },
    ],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities.length, 0, 'All invalid worlds must be discarded');
  assert.equal(sanitized.activities.some((a) => a.world === 'soundForest'), false, 'Must never silently fallback to soundForest');
});

it('Mixed valid and invalid worlds keep only valid records with re-indexed sequence', () => {
  const payload = {
    pseudonym: 'learner_8f3a12',
    activities: [
      { world: 'soundForest', round: 1, accuracy: 0.95 },
      { world: 'unsupportedGalaxy', round: 2, accuracy: 0.5 },
      { world: 'visionValley', round: 1, accuracy: 0.85 },
      { world: 'randomRealm', round: 3, accuracy: 0.4 },
    ],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities.length, 2);
  assert.equal(sanitized.activities[0].world, 'soundForest');
  assert.equal(sanitized.activities[0].index, 1);
  assert.equal(sanitized.activities[1].world, 'visionValley');
  assert.equal(sanitized.activities[1].index, 2);
});

console.log('\n=== SUITE 2: Contradictory & Missing Completion Fields ===');

it('Explicit in-progress is preserved even if completed is undefined', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1, completion_status: 'in-progress' }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'in-progress');
});

it('Explicit in-progress is preserved even if contradictory completed: true is present', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1, completion_status: 'in-progress', completed: true }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'in-progress', 'in-progress must not be overridden');
});

it('Explicit completed: false takes precedence even if completion_status: completed', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1, completion_status: 'completed', completed: false }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'in-progress', 'completed: false must keep it in-progress');
});

it('Explicit completed: true yields completed status', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1, completed: true }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'completed');
});

it('Explicit completion_status: completed yields completed status', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1, completion_status: 'completed' }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'completed');
});

it('Unspecified completion fields default safely to in-progress', () => {
  const payload = {
    activities: [{ world: 'soundForest', round: 1 }],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].completion_status, 'in-progress');
});

console.log('\n=== SUITE 3: Malformed & Out-of-Bounds Numeric Fields ===');

it('Clamps and defaults accuracy safely', () => {
  const payload = {
    activities: [
      { world: 'soundForest', round: 1, accuracy: NaN },
      { world: 'soundForest', round: 2, accuracy: -0.8 },
      { world: 'soundForest', round: 3, accuracy: 2.5 },
      { world: 'soundForest', round: 4, accuracy: 'invalid' },
      { world: 'soundForest', round: 5, accuracy: 0.85 },
    ],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].accuracy, 0);
  assert.equal(sanitized.activities[1].accuracy, 0);
  assert.equal(sanitized.activities[2].accuracy, 1.0);
  assert.equal(sanitized.activities[3].accuracy, 0);
  assert.equal(sanitized.activities[4].accuracy, 0.85);
});

it('Clamps attempts between 1 and 20 safely', () => {
  const payload = {
    activities: [
      { world: 'runeRealm', round: 1, attempts: NaN },
      { world: 'runeRealm', round: 2, attempts: -10 },
      { world: 'runeRealm', round: 3, attempts: 999 },
      { world: 'runeRealm', round: 4, attempts: 'five' },
      { world: 'runeRealm', round: 5, attempts: 3 },
    ],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].attempts, 1);
  assert.equal(sanitized.activities[1].attempts, 1);
  assert.equal(sanitized.activities[2].attempts, 20);
  assert.equal(sanitized.activities[3].attempts, 1);
  assert.equal(sanitized.activities[4].attempts, 3);
});

it('Clamps duration_seconds and hints safely', () => {
  const payload = {
    activities: [
      { world: 'storyCastle', round: 1, duration_seconds: -5, hints: -1 },
      { world: 'storyCastle', round: 2, duration_seconds: 99999, hints: 50 },
      { world: 'storyCastle', round: 3, duration_seconds: NaN, hints: NaN },
    ],
  };
  const sanitized = sanitizePayload(payload);
  assert.equal(sanitized.activities[0].duration_seconds, 1);
  assert.equal(sanitized.activities[0].hints, 0);
  assert.equal(sanitized.activities[1].duration_seconds, 3600);
  assert.equal(sanitized.activities[1].hints, 10);
  assert.equal(sanitized.activities[2].duration_seconds, 10);
  assert.equal(sanitized.activities[2].hints, 0);
});

console.log('\n=== SUITE 4: Privacy & PII Scrubbing ===');

it('Pseudonym validation accepts valid tokens and rejects arbitrary user names/PII', () => {
  assert.equal(sanitizePseudonym('learner_8f3a12'), 'learner_8f3a12');
  assert.equal(sanitizePseudonym('learner_anon'), 'learner_anon');
  assert.equal(sanitizePseudonym('learner_aabbccddeeff'), 'learner_aabbccddeeff');

  // Rejections of PII and arbitrary strings -> defaults to learner_anon
  assert.equal(sanitizePseudonym('Alice Smith'), 'learner_anon');
  assert.equal(sanitizePseudonym('john.doe@example.com'), 'learner_anon');
  assert.equal(sanitizePseudonym('student_12345'), 'learner_anon');
  assert.equal(sanitizePseudonym('<script>alert("xss")</script>'), 'learner_anon');
  assert.equal(sanitizePseudonym(''), 'learner_anon');
  assert.equal(sanitizePseudonym(null), 'learner_anon');
});

it('Age band validation accepts approved bands and rejects arbitrary text / PII', () => {
  assert.equal(sanitizeAgeBand('Early Years (Ages 3–5)'), 'Early Years (Ages 3–5)');
  assert.equal(sanitizeAgeBand('Primary (Ages 5–8)'), 'Primary (Ages 5–8)');
  assert.equal(sanitizeAgeBand('Intermediate (Ages 8–11)'), 'Intermediate (Ages 8–11)');
  assert.equal(sanitizeAgeBand('Primary (Ages 5–11)'), 'Primary (Ages 5–11)');
  assert.equal(sanitizeAgeBand('Not provided'), 'Not provided');

  // Never invent a default; reject free-text PII
  assert.equal(sanitizeAgeBand('Child is 7 years old born in Boston'), 'Not provided');
  assert.equal(sanitizeAgeBand(''), 'Not provided');
  assert.equal(sanitizeAgeBand(undefined), 'Not provided');
  assert.equal(sanitizeAgeBand(null), 'Not provided');
});

it('Domain validation restricts strictly to allowed domains and scrubs free-text PII', () => {
  assert.equal(sanitizeDomain('phonological'), 'phonological');
  assert.equal(sanitizeDomain('reading'), 'reading');
  assert.equal(sanitizeDomain('writing_motor'), 'writing_motor');
  assert.equal(sanitizeDomain('math_number'), 'math_number');
  assert.equal(sanitizeDomain('memory'), 'memory');
  assert.equal(sanitizeDomain('vision'), 'vision');

  // Fix: numberSense enum normalization (lowercase consistency)
  assert.equal(sanitizeDomain('numberSense'), 'numbersense', 'CamelCase numberSense must normalize to numbersense');
  assert.equal(sanitizeDomain('numbersense'), 'numbersense', 'Lowercase numbersense must be accepted');
  assert.ok(ALLOWED_DOMAINS.has('numbersense'), 'ALLOWED_DOMAINS must contain lowercase numbersense');

  // Free-text with PII or arbitrary labels map to 'general'
  assert.equal(sanitizeDomain('Jane Doe reading score 98%'), 'general');
  assert.equal(sanitizeDomain('phone 555-0199'), 'general');
  assert.equal(sanitizeDomain(''), 'general');
  assert.equal(sanitizeDomain(null), 'general');
});

it('PerspectiveRole validation preserves valid roles and safely defaults unapproved roles to teacher', () => {
  assert.equal(sanitizePerspectiveRole('student'), 'student');
  assert.equal(sanitizePerspectiveRole('parent'), 'parent');
  assert.equal(sanitizePerspectiveRole('teacher'), 'teacher');
  assert.equal(sanitizePerspectiveRole('specialist'), 'specialist');
  assert.equal(sanitizePerspectiveRole('STUDENT'), 'student', 'Case-insensitive normalization');

  // Unapproved / arbitrary roles default to 'teacher'
  assert.equal(sanitizePerspectiveRole('hacker'), 'teacher');
  assert.equal(sanitizePerspectiveRole('admin'), 'teacher');
  assert.equal(sanitizePerspectiveRole(''), 'teacher');
  assert.equal(sanitizePerspectiveRole(undefined), 'teacher');

  // Confirms perspectiveRole survives sanitizePayload()
  const payload1 = { perspectiveRole: 'specialist', activities: [] };
  assert.equal(sanitizePayload(payload1).perspectiveRole, 'specialist');

  const payload2 = { perspectiveRole: 'parent', activities: [{ world: 'soundForest', domain: 'numberSense' }] };
  const res2 = sanitizePayload(payload2);
  assert.equal(res2.perspectiveRole, 'parent');
  assert.equal(res2.activities[0].domain, 'numbersense', 'numberSense activity domain accepted and normalized');

  const payload3 = { activities: [] };
  assert.equal(sanitizePayload(payload3).perspectiveRole, 'teacher', 'Defaults to teacher when omitted');
});

it('Activity name validation accepts approved curriculum titles and scrubs free-text PII', () => {
  // Approved titles
  assert.equal(sanitizeActivityName('Slash Quest', 'soundForest', 1), 'Slash Quest');
  assert.equal(sanitizeActivityName('Magic Words', 'storyCastle', 1), 'Magic Words');
  assert.equal(sanitizeActivityName('Follow', 'visionValley', 1), 'Follow');
  assert.equal(sanitizeActivityName('Magic Circle', 'runeRealm', 1), 'Magic Circle');
  assert.equal(sanitizeActivityName('Remember Objects', 'memoryMountains', 1), 'Remember Objects');

  // Safe Round format
  assert.equal(sanitizeActivityName('Round 3', 'soundForest', 3), 'Round 3');

  // Arbitrary free-text with PII must be scrubbed to Round X
  assert.equal(
    sanitizeActivityName('Alice Smith at alice@test.org ssn 123-45-6789', 'soundForest', 1),
    'Round 1',
    'Free-text PII must be scrubbed and replaced with canonical round format'
  );
  assert.equal(
    sanitizeActivityName('Call parent at +1 555 987 6543 immediately', 'storyCastle', 4),
    'Round 4'
  );
});

console.log('\n=== SUITE 5: Client-IP & Rate Limiting Architecture ===');

it('Extracts leftmost client IP from X-Forwarded-For chain and validates address grammar', () => {
  const req1 = { headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' } };
  assert.equal(getClientIp(req1), '203.0.113.195');

  const req2 = { headers: { 'x-real-ip': '198.51.100.42' } };
  assert.equal(getClientIp(req2), '198.51.100.42');

  const req3 = { headers: { 'x-forwarded-for': '<script>alert("hack")</script>' }, socket: { remoteAddress: '10.0.0.5' } };
  assert.equal(getClientIp(req3), '10.0.0.5', 'Malformed IP header must fall back to safe remoteAddress');

  const req4 = { headers: {} };
  assert.equal(getClientIp(req4), '127.0.0.1');
});

it('Enforces 30 requests per minute rate limit and returns remaining count', () => {
  const testIp = '192.0.2.99';
  const first = checkRateLimit(testIp);
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 29);

  for (let i = 0; i < 28; i++) {
    checkRateLimit(testIp);
  }
  const thirtieth = checkRateLimit(testIp);
  assert.equal(thirtieth.allowed, true);
  assert.equal(thirtieth.remaining, 0);

  const thirtyFirst = checkRateLimit(testIp);
  assert.equal(thirtyFirst.allowed, false);
  assert.equal(thirtyFirst.remaining, 0);
  assert.ok(thirtyFirst.resetInSeconds > 0);
});

console.log('\n=== SUITE 6: End-to-End Handler Integration & Schema Contract ===');

await itAsync('POST /api/insights returns HTTP 200 with contract-compliant fallback structure', async () => {
  const requestBody = JSON.stringify({
    pseudonym: 'learner_8f3a12',
    ageBand: 'Primary (Ages 5–8)',
    activities: [
      { world: 'soundForest', round: 1, activity: 'Slash Quest', domain: 'phonological', accuracy: 0.95, attempts: 1, duration_seconds: 14, completion_status: 'completed' },
      { world: 'soundForest', round: 2, activity: 'Sound Match', domain: 'phonological', accuracy: 0.85, attempts: 2, duration_seconds: 18, completion_status: 'completed' },
      { world: 'visionValley', round: 1, activity: 'Follow', domain: 'vision', accuracy: 0.90, attempts: 1, duration_seconds: 12, completion_status: 'completed' },
      // Invalid world that should be discarded
      { world: 'invalidCosmos', round: 1, activity: 'Cosmic Quest', domain: 'phonological', accuracy: 0.5, attempts: 1, completion_status: 'completed' },
    ],
  });

  const req = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(requestBody),
      'x-forwarded-for': '198.51.100.77',
    },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(requestBody);
    },
  };

  let statusCode = 0;
  const headers = {};
  let responseData = '';

  const res = {
    setHeader(name, val) {
      headers[name.toLowerCase()] = val;
    },
    set statusCode(code) {
      statusCode = code;
    },
    get statusCode() {
      return statusCode;
    },
    end(data) {
      responseData = data;
    },
  };

  await handler(req, res);

  assert.equal(statusCode, 200, 'Expected HTTP 200');
  assert.equal(headers['content-type'], 'application/json');
  assert.equal(headers['x-ratelimit-limit'], '30');

  const parsed = JSON.parse(responseData);
  assert.ok(parsed.source === 'gemini' || parsed.source === 'fallback');
  assert.ok(parsed.engine);
  assert.ok(parsed.notice);
  assert.ok(parsed.timestamp);

  // Validate exact data contract
  const data = parsed.data;
  assert.ok(typeof data.summary === 'string');
  assert.ok(data.worldInsights && typeof data.worldInsights === 'object');
  assert.ok(Array.isArray(data.strengths));
  assert.ok(Array.isArray(data.practiceAreas));
  assert.ok(Array.isArray(data.progressObservations));
  assert.ok(Array.isArray(data.recommendedActivities));

  // Verify all 5 worlds are in worldInsights
  const worlds = ['soundForest', 'visionValley', 'storyCastle', 'runeRealm', 'memoryMountains'];
  for (const w of worlds) {
    assert.ok(data.worldInsights[w], `World ${w} must be present in worldInsights`);
    assert.ok(['sufficient', 'insufficient', 'no_data'].includes(data.worldInsights[w].dataSufficiency));
  }

  // Sound Forest had 2 rounds -> sufficient
  assert.equal(data.worldInsights.soundForest.dataSufficiency, 'sufficient');
  // Vision Valley had 1 round -> insufficient (product threshold)
  assert.equal(data.worldInsights.visionValley.dataSufficiency, 'insufficient');
  // Story Castle had 0 rounds -> no_data
  assert.equal(data.worldInsights.storyCastle.dataSufficiency, 'no_data');
});

await itAsync('Rejects payloads larger than 50KB with HTTP 413', async () => {
  const hugeData = 'x'.repeat(55 * 1024);
  const req = {
    method: 'POST',
    headers: {
      'content-length': 55 * 1024,
      'x-forwarded-for': '198.51.100.88',
    },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(hugeData);
    },
  };

  let statusCode = 0;
  const res = {
    setHeader() {},
    set statusCode(code) { statusCode = code; },
    get statusCode() { return statusCode; },
    end() {},
  };

  await handler(req, res);
  assert.equal(statusCode, 413, 'Must return HTTP 413 Payload Too Large');
});

await itAsync('Rejects malformed JSON with HTTP 400', async () => {
  const badJson = '{ malformed json: not valid';
  const req = {
    method: 'POST',
    headers: {
      'content-length': badJson.length,
      'x-forwarded-for': '198.51.100.89',
    },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(badJson);
    },
  };

  let statusCode = 0;
  const res = {
    setHeader() {},
    set statusCode(code) { statusCode = code; },
    get statusCode() { return statusCode; },
    end() {},
  };

  await handler(req, res);
  assert.equal(statusCode, 400, 'Must return HTTP 400 Bad Request');
});

console.log(`\n========================================`);
console.log(`ALL ${passed}/${total} VALIDATION TESTS PASSED!`);
console.log(`========================================\n`);
