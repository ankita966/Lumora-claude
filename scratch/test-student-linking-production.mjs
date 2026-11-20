import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('🧪 Starting LUMORA Production Student Linking & Demo Removal Audit...\n');

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function checkAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ============================================================
// SUITE 1: SOURCE CODE AUDIT — DEMO & SAMPLE ERADICATION
// ============================================================
console.log('=== SUITE 1: SOURCE CODE AUDIT — DEMO MODE REMOVAL ===');

const srcFiles = [
  'src/dashboards/LearningInsightsReport.jsx',
  'src/dashboards/ParentDashboard.jsx',
  'src/dashboards/TeacherDashboard.jsx',
  'src/dashboards/SpecialistDashboard.jsx',
  'src/dashboards/SchoolAdminDashboard.jsx',
  'src/components/StudentLinkCode.jsx',
  'src/services/linkedStudents.js',
  'src/auth/AuthProvider.jsx',
  'src/auth/AuthScreen.jsx',
  'src/App.jsx',
];

check('1.1 Zero occurrences of sample learners "Alex Rivera" or "Maya Chen"', () => {
  for (const path of srcFiles) {
    const content = fs.readFileSync(path, 'utf8');
    assert.ok(!content.includes('Alex Rivera'), `${path} still contains "Alex Rivera"`);
    assert.ok(!content.includes('Maya Chen'), `${path} still contains "Maya Chen"`);
  }
});

check('1.2 Zero occurrences of DEMO / PREVIEW MODE banner in components', () => {
  for (const path of srcFiles) {
    const content = fs.readFileSync(path, 'utf8');
    assert.ok(!content.includes('DEMO / PREVIEW MODE'), `${path} still contains DEMO / PREVIEW MODE banner`);
    assert.ok(!content.includes('insights-sample-banner'), `${path} still references insights-sample-banner`);
    assert.ok(!content.includes('insights-sample-toggle'), `${path} still references insights-sample-toggle`);
  }
});

check('1.3 Required empty state string is strictly implemented in all viewer dashboards and reports', () => {
  const expectedEmptyState = 'No learners linked yet. Generate or enter a student linking code to connect a learner.';
  const reportCode = fs.readFileSync('src/dashboards/LearningInsightsReport.jsx', 'utf8');
  const parentCode = fs.readFileSync('src/dashboards/ParentDashboard.jsx', 'utf8');
  const teacherCode = fs.readFileSync('src/dashboards/TeacherDashboard.jsx', 'utf8');
  const specialistCode = fs.readFileSync('src/dashboards/SpecialistDashboard.jsx', 'utf8');

  assert.ok(reportCode.includes(expectedEmptyState), 'LearningInsightsReport must include exact empty state string');
  assert.ok(parentCode.includes(expectedEmptyState), 'ParentDashboard must include exact empty state string');
  assert.ok(teacherCode.includes(expectedEmptyState), 'TeacherDashboard must include exact empty state string');
  assert.ok(specialistCode.includes(expectedEmptyState), 'SpecialistDashboard must include exact empty state string');
});

check('1.4 Zero localStorage simulation or persistence in linkedStudents.js', () => {
  const code = fs.readFileSync('src/services/linkedStudents.js', 'utf8');
  assert.ok(!code.includes('localStorage.setItem'), 'linkedStudents.js must not save links or codes to localStorage');
  assert.ok(!code.includes('localStorage.getItem'), 'linkedStudents.js must not load links or codes from localStorage');
  assert.ok(!code.includes('lumora-active-link-codes'), 'localStorage mock active-link-codes key must not exist');
  assert.ok(!code.includes('lumora-parent-linked-students'), 'localStorage mock linked-students key must not exist');
});

check('1.5 StudentLinkCode.jsx has removed student inspection / lookup tabs', () => {
  const code = fs.readFileSync('src/components/StudentLinkCode.jsx', 'utf8');
  assert.ok(!code.includes('getLinkCodeDetails'), 'getLinkCodeDetails must not be in StudentLinkCode.jsx');
  assert.ok(!code.includes('activeTab'), 'StudentLinkCode.jsx must focus exclusively on code creation');
  assert.ok(code.includes('createStudentLinkCode'), 'StudentLinkCode.jsx creates real link codes');
});

check('1.6 AuthProvider and AuthScreen eliminate silent fallback to demo accounts', () => {
  const authProviderCode = fs.readFileSync('src/auth/AuthProvider.jsx', 'utf8');
  const authScreenCode = fs.readFileSync('src/auth/AuthScreen.jsx', 'utf8');
  assert.ok(!authProviderCode.includes('createDemoAccount'), 'AuthProvider must not expose createDemoAccount');
  assert.ok(!authProviderCode.includes('demoAccount'), 'AuthProvider must not contain demoAccount state');
  assert.ok(!authScreenCode.includes('enterDemoPortal'), 'AuthScreen must not fall back to enterDemoPortal');
  assert.ok(!authScreenCode.includes('createFallbackAccount'), 'AuthScreen must not create fallback demo accounts');
});

// ============================================================
// SUITE 2: DATABASE MIGRATION & RLS VERIFICATION
// ============================================================
console.log('\n=== SUITE 2: DATABASE MIGRATION & RLS VERIFICATION ===');

check('2.1 Migration 202611210001_teacher_student_linking.sql exists and has valid SQL structure', () => {
  assert.ok(fs.existsSync('supabase/migrations/202611210001_teacher_student_linking.sql'), 'Migration file must exist');
  const sql = fs.readFileSync('supabase/migrations/202611210001_teacher_student_linking.sql', 'utf8');
  assert.ok(sql.includes('create or replace function public.create_student_link_code()'), 'create_student_link_code RPC defined');
  assert.ok(sql.includes('create or replace function public.claim_student_link_code(p_link_code text)'), 'claim_student_link_code RPC defined');
  assert.ok(sql.includes('grant execute on function public.create_student_link_code() to authenticated'), 'execute granted to authenticated');
  assert.ok(sql.includes('grant execute on function public.claim_student_link_code(text) to authenticated'), 'execute granted to authenticated');
});

check('2.2 Migration enforces role-based access for parents, teachers, and specialists', () => {
  const sql = fs.readFileSync('supabase/migrations/202611210001_teacher_student_linking.sql', 'utf8');
  assert.ok(sql.includes("public.has_role('parent')"), 'Checks parent role');
  assert.ok(sql.includes("public.has_role('teacher')"), 'Checks teacher role');
  assert.ok(sql.includes("public.has_role('specialist')"), 'Checks specialist role');
  assert.ok(sql.includes('student_access_grants'), 'Inserts into student_access_grants for staff');
  assert.ok(sql.includes('student_guardians'), 'Inserts into student_guardians for parents');
  assert.ok(sql.includes('delete from public.student_link_codes'), 'Deletes claimed code to prevent reuse');
});

check('2.3 Migration enforces code expiry (30 minutes)', () => {
  const sql = fs.readFileSync('supabase/migrations/202611210001_teacher_student_linking.sql', 'utf8');
  assert.ok(sql.includes("interval '30 minutes'"), '30-minute interval configured');
  assert.ok(sql.includes('codes.expires_at > now()'), 'Enforces active non-expired code');
});

// ============================================================
// SUITE 3: LINKEDSTUDENTS SERVICE LOGIC & CONTRACT VERIFICATION
// ============================================================
console.log('\n=== SUITE 3: LINKEDSTUDENTS SERVICE CONTRACT ===');

await checkAsync('3.1 createStudentLinkCode fails cleanly when Supabase is not configured', async () => {
  const { createStudentLinkCode } = await import('../src/services/linkedStudents.js');
  try {
    await createStudentLinkCode();
    assert.fail('Should have thrown an error when unconfigured');
  } catch (err) {
    assert.ok(err.message.includes('Supabase is not configured'), `Error message mentions unconfigured Supabase: ${err.message}`);
  }
});

await checkAsync('3.2 claimStudentLinkCode rejects empty/invalid code input immediately', async () => {
  const { claimStudentLinkCode } = await import('../src/services/linkedStudents.js');
  try {
    await claimStudentLinkCode('   ');
    assert.fail('Should have rejected blank code');
  } catch (err) {
    assert.ok(err.message.includes('valid student link code'), `Rejection message clear: ${err.message}`);
  }
});

await checkAsync('3.3 loadLinkedStudents returns empty array when unconfigured or no viewerId', async () => {
  const { loadLinkedStudents } = await import('../src/services/linkedStudents.js');
  const result1 = await loadLinkedStudents(null, 'parent');
  const result2 = await loadLinkedStudents('any-id', 'teacher');
  assert.deepEqual(result1, [], 'null viewer returns []');
  assert.deepEqual(result2, [], 'unconfigured Supabase returns []');
});

console.log(`\n========================================`);
console.log(`PRODUCTION FIX AUDIT: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) process.exit(1);

