import {
  createStudentLinkCode,
  claimStudentLinkCode,
  loadLinkedStudents,
  getLinkCodeDetails,
} from '../src/services/linkedStudents.js';

// Mock localStorage for Node environment
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

async function runTests() {
  console.log('🧪 Starting Student Linking & Demo Mode Removal Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Code generation with authentic snapshot
  const realStudentSnapshot = {
    id: 'student-real-001',
    displayName: 'Sammy Star',
    xp: 450,
    sessionsCompleted: 1,
    totalTimeMs: 120000,
    worldsCompleted: { soundForest: true },
    activityLog: [
      { world: 'soundForest', round: 1, skill: 'sound', accuracy: 0.9, attempts: 1, timeMs: 15000, ts: Date.now() }
    ],
    sessionLog: [
      { id: 'sess-real-1', world: 'soundForest', startedAt: Date.now() - 120000, completedAt: Date.now() }
    ],
  };

  const createResult = await createStudentLinkCode(realStudentSnapshot);
  assert(createResult?.link_code?.startsWith('LUMORA-'), `Generated code has LUMORA- prefix: ${createResult?.link_code}`);
  assert(Boolean(createResult?.expires_at), `Generated code has expiration timestamp: ${createResult?.expires_at}`);

  // TEST 2: Invalid code fails cleanly
  try {
    await claimStudentLinkCode('INVALID-CODE-999', 'teacher', 'teacher-uuid-1');
    assert(false, 'Invalid code should have thrown an error');
  } catch (err) {
    assert(err.message.includes('invalid or expired'), `Invalid code shows clear error: "${err.message}"`);
  }

  // TEST 3: Sample learner codes (e.g. Alex, Maya) must NOT work
  try {
    await claimStudentLinkCode('ALEX', 'teacher', 'teacher-uuid-1');
    assert(false, 'Sample code "ALEX" should NOT work');
  } catch (err) {
    assert(err.message.includes('invalid or expired'), `Sample learner code "ALEX" rejected: "${err.message}"`);
  }

  // TEST 4: Valid code claims student successfully for Teacher
  const teacherId = 'teacher-ms-smith';
  const claimResult = await claimStudentLinkCode(createResult.link_code, 'teacher', teacherId);
  assert(claimResult.student_id === 'student-real-001', `Claimed correct student ID: ${claimResult.student_id}`);
  assert(claimResult.display_name === 'Sammy Star', `Claimed correct display name: ${claimResult.display_name}`);

  // TEST 5: Code consumption (cannot be claimed a second time)
  try {
    await claimStudentLinkCode(createResult.link_code, 'teacher', 'other-teacher');
    assert(false, 'Re-using a claimed code should throw an error');
  } catch (err) {
    assert(err.message.includes('invalid or expired'), `Already-claimed code is consumed and rejected: "${err.message}"`);
  }

  // TEST 6: Persistence & load for teacher
  const teacherStudents = await loadLinkedStudents(teacherId, 'teacher');
  assert(teacherStudents.length === 1, `Teacher has exactly 1 linked student (got ${teacherStudents.length})`);
  assert(teacherStudents[0]?.displayName === 'Sammy Star', `Loaded student name is "Sammy Star"`);
  assert(teacherStudents[0]?.xp === 450, `Student XP is authentic: ${teacherStudents[0]?.xp}`);
  assert(teacherStudents[0]?.activityLog?.length === 1, `Student activity log preserved`);

  // TEST 7: Authorization scoping (different teacher has empty roster)
  const otherTeacherStudents = await loadLinkedStudents('teacher-mr-jones', 'teacher');
  assert(otherTeacherStudents.length === 0, `Unassigned teacher has 0 students (got ${otherTeacherStudents.length})`);

  // TEST 8: Parent linking test
  const childSnapshot = {
    id: 'student-child-002',
    displayName: 'Emma Bloom',
    xp: 200,
    sessionsCompleted: 1,
    totalTimeMs: 60000,
    worldsCompleted: {},
    activityLog: [],
    sessionLog: [],
  };
  const parentCodeResult = await createStudentLinkCode(childSnapshot);
  const parentId = 'parent-uuid-001';
  const parentClaimResult = await claimStudentLinkCode(parentCodeResult.link_code, 'parent', parentId);
  assert(parentClaimResult.display_name === 'Emma Bloom', `Parent successfully linked Emma Bloom`);

  const parentStudents = await loadLinkedStudents(parentId, 'parent');
  assert(parentStudents.length === 1 && parentStudents[0]?.displayName === 'Emma Bloom', `Parent loads only Emma Bloom`);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

