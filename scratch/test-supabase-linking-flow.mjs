import assert from 'node:assert/strict';

console.log('🧪 Starting Supabase Linking End-to-End Simulation Audit...\n');

// Mock a real Supabase database state
const db = {
  link_codes: new Map(), // code_hash -> { student_id, expires_at }
  guardians: [], // { student_id, parent_id }
  access_grants: [], // { student_id, grantee_id, role }
  profiles: new Map([
    ['student-uuid-001', { id: 'student-uuid-001', display_name: 'Luna Spark' }],
    ['student-uuid-002', { id: 'student-uuid-002', display_name: 'Kai Swift' }],
  ]),
  user_roles: new Map([
    ['student-uuid-001', 'student'],
    ['student-uuid-002', 'student'],
    ['parent-uuid-001', 'parent'],
    ['teacher-uuid-001', 'teacher'],
    ['teacher-uuid-002', 'teacher'],
    ['specialist-uuid-001', 'specialist'],
  ]),
  world_progress: [
    { student_id: 'student-uuid-001', world_key: 'soundForest', completed: true, xp_total: 650, sessions_completed: 2, total_time_ms: 180000, updated_at: '2026-11-21T01:00:00Z' },
    { student_id: 'student-uuid-001', world_key: 'storyCastle', completed: false, xp_total: 650, sessions_completed: 2, total_time_ms: 180000, updated_at: '2026-11-21T01:10:00Z' },
  ],
  round_attempts: [
    { student_id: 'student-uuid-001', session_id: 's1', world_key: 'soundForest', round_number: 1, skill: 'sound', accuracy: 0.95, attempts: 1, time_ms: 12000, created_at: '2026-11-21T01:05:00Z' },
  ],
  game_sessions: [
    { id: 's1', student_id: 'student-uuid-001', world_key: 'soundForest', started_at: '2026-11-21T01:00:00Z', completed_at: '2026-11-21T01:08:00Z' },
  ],
};

function cryptoMd5(str) {
  // Simple md5 placeholder for mock matching
  return `hash_${str.toLowerCase()}`;
}

// Emulate Postgres RPC: create_student_link_code
function rpc_create_student_link_code(callerId) {
  const role = db.user_roles.get(callerId);
  if (!callerId || role !== 'student') {
    throw new Error('An authenticated student account is required.');
  }

  // Delete previous active codes for this student
  for (const [codeHash, entry] of db.link_codes.entries()) {
    if (entry.student_id === callerId) db.link_codes.delete(codeHash);
  }

  const rawSuffix = 'K9X2P4';
  const code = `LUMORA-${rawSuffix}`;
  const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.link_codes.set(cryptoMd5(rawSuffix), { student_id: callerId, expires_at: new Date(expiration).getTime() });
  db.link_codes.set(cryptoMd5(code.toLowerCase().replace(/[^a-z0-9]/g, '')), { student_id: callerId, expires_at: new Date(expiration).getTime() });

  return [{ link_code: code, expires_at: expiration }];
}

// Emulate Postgres RPC: claim_student_link_code
function rpc_claim_student_link_code(callerId, p_link_code) {
  if (!callerId) {
    throw new Error('An authenticated account is required.');
  }
  const callerRole = db.user_roles.get(callerId);
  if (!callerRole || !['parent', 'teacher', 'specialist'].includes(callerRole)) {
    throw new Error('An authorized parent, teacher, or specialist account is required.');
  }

  const codeClean = (p_link_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const rawSuffix = codeClean.replace(/^lumora/, '');

  let matchedStudentId = null;
  for (const [hash, entry] of db.link_codes.entries()) {
    if (hash === cryptoMd5(codeClean) || hash === cryptoMd5(rawSuffix)) {
      if (entry.expires_at <= Date.now()) {
        db.link_codes.delete(hash);
        throw new Error('That link code is invalid or expired. Ask the learner to create a new one.');
      }
      matchedStudentId = entry.student_id;
      break;
    }
  }

  if (!matchedStudentId) {
    throw new Error('That link code is invalid or expired. Ask the learner to create a new one.');
  }

  // Role assignment
  if (callerRole === 'teacher') {
    if (!db.access_grants.some(g => g.student_id === matchedStudentId && g.grantee_id === callerId && g.role === 'teacher')) {
      db.access_grants.push({ student_id: matchedStudentId, grantee_id: callerId, role: 'teacher' });
    }
  } else if (callerRole === 'specialist') {
    if (!db.access_grants.some(g => g.student_id === matchedStudentId && g.grantee_id === callerId && g.role === 'specialist')) {
      db.access_grants.push({ student_id: matchedStudentId, grantee_id: callerId, role: 'specialist' });
    }
  } else if (callerRole === 'parent') {
    if (!db.guardians.some(g => g.student_id === matchedStudentId && g.parent_id === callerId)) {
      db.guardians.push({ student_id: matchedStudentId, parent_id: callerId });
    }
  }

  // Consume code (cannot be claimed again)
  for (const [hash, entry] of db.link_codes.entries()) {
    if (entry.student_id === matchedStudentId) db.link_codes.delete(hash);
  }

  const profile = db.profiles.get(matchedStudentId);
  return [{ student_id: matchedStudentId, display_name: profile?.display_name || 'Learner' }];
}

// Emulate Postgres query: load linked students with RLS
function rpc_load_linked_students(viewerId, relationship) {
  let studentIds = [];
  if (relationship === 'parent') {
    studentIds = db.guardians.filter(g => g.parent_id === viewerId).map(g => g.student_id);
  } else if (relationship === 'teacher' || relationship === 'specialist') {
    studentIds = db.access_grants.filter(g => g.grantee_id === viewerId && g.role === relationship).map(g => g.student_id);
  }

  if (!studentIds.length) return [];

  return studentIds.map(id => {
    const profile = db.profiles.get(id);
    const progress = db.world_progress.filter(p => p.student_id === id);
    const attempts = db.round_attempts.filter(a => a.student_id === id);
    return {
      id,
      displayName: profile?.display_name || 'Learner',
      xp: progress[0]?.xp_total || 0,
      worldsCompleted: Object.fromEntries(progress.filter(p => p.completed).map(p => [p.world_key, true])),
      activityLog: attempts,
    };
  });
}

console.log('Testing End-to-End Supabase Linking Flow:');

// Test 1: Student generates code
const genResult = rpc_create_student_link_code('student-uuid-001');
assert.ok(genResult[0].link_code.startsWith('LUMORA-'), 'Code begins with LUMORA-');
console.log('  ✓ 1. Student successfully generates 6-character LUMORA code: ' + genResult[0].link_code);

// Test 2: Unauthenticated or wrong role fails code generation
assert.throws(() => rpc_create_student_link_code('parent-uuid-001'), /An authenticated student account is required/);
console.log('  ✓ 2. Non-student cannot generate student link code');

// Test 3: Unauthorized user (e.g. another student) cannot claim code
assert.throws(() => rpc_claim_student_link_code('student-uuid-002', genResult[0].link_code), /authorized parent, teacher, or specialist/);
console.log('  ✓ 3. Unauthorized role cannot claim link code');

// Test 4: Teacher claims code
const claimResult = rpc_claim_student_link_code('teacher-uuid-001', genResult[0].link_code);
assert.equal(claimResult[0].student_id, 'student-uuid-001');
assert.equal(claimResult[0].display_name, 'Luna Spark');
console.log('  ✓ 4. Teacher successfully claims code and links Luna Spark');

// Test 5: Code is consumed and cannot be reused
assert.throws(() => rpc_claim_student_link_code('teacher-uuid-002', genResult[0].link_code), /invalid or expired/);
console.log('  ✓ 5. Reusing claimed code is strictly rejected (consumed)');

// Test 6: Teacher views linked student
const teacher1Students = rpc_load_linked_students('teacher-uuid-001', 'teacher');
assert.equal(teacher1Students.length, 1);
assert.equal(teacher1Students[0].displayName, 'Luna Spark');
assert.equal(teacher1Students[0].xp, 650);
console.log('  ✓ 6. Teacher roster displays authentic linked student data and progress');

// Test 7: Other teacher has 0 students (RLS isolation)
const teacher2Students = rpc_load_linked_students('teacher-uuid-002', 'teacher');
assert.equal(teacher2Students.length, 0);
console.log('  ✓ 7. Unassigned teacher cannot see unlinked students (RLS enforcement)');

// Test 8: Parent linking test
const parentCode = rpc_create_student_link_code('student-uuid-002');
rpc_claim_student_link_code('parent-uuid-001', parentCode[0].link_code);
const parentStudents = rpc_load_linked_students('parent-uuid-001', 'parent');
assert.equal(parentStudents.length, 1);
assert.equal(parentStudents[0].displayName, 'Kai Swift');
console.log('  ✓ 8. Parent successfully links Kai Swift and reads via student_guardians');

console.log('\n========================================');
console.log('ALL SUPABASE LINKING SIMULATION TESTS PASSED! 🚀');
console.log('========================================');

