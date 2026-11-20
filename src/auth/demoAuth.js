/**
 * Secure Demo & Sandbox Authentication Service.
 * Provides ephemeral, in-memory/session-scoped personas for local evaluation
 * without persisting unsalted plaintext credentials to browser storage.
 */

const SESSION_STORAGE_KEY = 'lumora-sandbox-session-v2';
const VALID_ROLES = new Set(['student', 'teacher', 'parent', 'school_admin', 'specialist']);

// In-memory demo account registry (ephemeral per page session)
const inMemorySandboxAccounts = new Map();
const demoLinkCodes = new Map();
const demoGuardians = new Map();
const demoStaffAssignments = new Map();

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function saltedPasswordDigest(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  return [...new Uint8Array(exported)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function publicAccount(account) {
  return {
    id: account.id,
    displayName: account.displayName,
    email: account.email,
    role: account.role,
  };
}

export function getDemoSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.email) return null;
    const account = inMemorySandboxAccounts.get(normalizeEmail(session.email));
    return account ? publicAccount(account) : null;
  } catch {
    return null;
  }
}

export function listDemoAccounts() {
  const current = getDemoSession();
  if (current?.role !== 'school_admin') return [];
  return [...inMemorySandboxAccounts.values()].map((account) => ({
    id: account.id,
    display_name: account.displayName,
    email: account.email,
    roles: [account.role],
    account_status: 'active',
  }));
}

export function createDemoStudentLinkCode(studentId) {
  const current = getDemoSession();
  if (!current || current.id !== studentId || current.role !== 'student') {
    throw new Error('Sign in to the student account that you want to link.');
  }
  for (const [code, record] of demoLinkCodes) {
    if (record.studentId === studentId) demoLinkCodes.delete(code);
  }
  const code = crypto.randomUUID().replaceAll('-', '').toUpperCase();
  const expiresAt = Date.now() + 30 * 60 * 1000;
  demoLinkCodes.set(code, { studentId, expiresAt });
  return { link_code: code, expires_at: new Date(expiresAt).toISOString() };
}

export function claimDemoStudentLinkCode(parentId, rawCode) {
  const current = getDemoSession();
  if (!current || current.id !== parentId || current.role !== 'parent') {
    throw new Error('Sign in to an authorized parent account to link a learner.');
  }
  const code = typeof rawCode === 'string' ? rawCode.replace(/[^a-f0-9]/gi, '').toUpperCase() : '';
  const record = demoLinkCodes.get(code);
  if (!record || record.expiresAt <= Date.now()) {
    demoLinkCodes.delete(code);
    throw new Error('That link code is invalid or expired. Ask the learner to create a new one.');
  }
  const student = [...inMemorySandboxAccounts.values()].find((account) => account.id === record.studentId && account.role === 'student');
  if (!student) throw new Error('The student demo account is no longer available in this browser session.');
  const linked = demoGuardians.get(parentId) ?? new Set();
  linked.add(student.id);
  demoGuardians.set(parentId, linked);
  demoLinkCodes.delete(code);
  return { student_id: student.id, display_name: student.displayName };
}

export function assignDemoStudentAccess({ studentId, granteeId, role }) {
  const current = getDemoSession();
  if (current?.role !== 'school_admin') throw new Error('School-admin authorization is required to assign learners.');
  if (!['teacher', 'specialist'].includes(role)) throw new Error('Choose a teacher or specialist role.');
  const student = [...inMemorySandboxAccounts.values()].find((account) => account.id === studentId && account.role === 'student');
  const grantee = [...inMemorySandboxAccounts.values()].find((account) => account.id === granteeId && account.role === role);
  if (!student || !grantee) throw new Error('Choose an existing student and an account with the selected staff role.');
  const assignments = demoStaffAssignments.get(granteeId) ?? new Set();
  assignments.add(`${role}:${studentId}`);
  demoStaffAssignments.set(granteeId, assignments);
}

export function loadDemoLinkedStudents(viewerId, relationship) {
  const current = getDemoSession();
  if (!current || current.id !== viewerId) return [];
  let studentIds = [];
  if (relationship === 'parent' && current.role === 'parent') {
    studentIds = [...(demoGuardians.get(viewerId) ?? [])];
  } else if (['teacher', 'specialist'].includes(relationship) && current.role === relationship) {
    studentIds = [...(demoStaffAssignments.get(viewerId) ?? [])]
      .filter((assignment) => assignment.startsWith(`${relationship}:`))
      .map((assignment) => assignment.slice(relationship.length + 1));
  }
  return studentIds.map((id) => {
    const student = [...inMemorySandboxAccounts.values()].find((account) => account.id === id && account.role === 'student');
    if (!student) return null;
    return {
      id: student.id,
      displayName: student.displayName,
      xp: student.xp ?? 0,
      sessionsCompleted: student.sessionsCompleted ?? 0,
      totalTimeMs: student.totalTimeMs ?? 0,
      worldsCompleted: { ...(student.worldsCompleted ?? {}) },
      activityLog: [...(student.activityLog ?? [])],
      sessionLog: [...(student.sessionLog ?? [])],
    };
  }).filter(Boolean);
}

export function startDemoGameSession(studentId, world) {
  const current = getDemoSession();
  if (!current || current.id !== studentId || current.role !== 'student') return null;
  const session = { id: crypto.randomUUID(), world, startedAt: Date.now(), completedAt: null };
  currentAccount(studentId).sessionLog.push(session);
  return session.id;
}

export function recordDemoAttempt(studentId, attempt) {
  const current = getDemoSession();
  if (!current || current.id !== studentId || current.role !== 'student') return;
  const account = currentAccount(studentId);
  account.activityLog.push({
    world: attempt.world,
    round: attempt.round,
    skill: attempt.skill,
    accuracy: Number(attempt.accuracy),
    attempts: attempt.attempts,
    timeMs: attempt.timeMs,
    sessionId: attempt.sessionId,
    ts: Date.now(),
  });
  account.totalTimeMs += attempt.timeMs;
  if (attempt.worldCompleted) {
    account.worldsCompleted[attempt.world] = true;
    account.sessionsCompleted += 1;
    const session = account.sessionLog.find((entry) => entry.id === attempt.sessionId);
    if (session) session.completedAt = Date.now();
  }
}

function currentAccount(id) {
  return [...inMemorySandboxAccounts.values()].find((account) => account.id === id);
}

function initializeProgress(account) {
  return {
    ...account,
    activityLog: [],
    sessionLog: [],
    worldsCompleted: {},
    sessionsCompleted: 0,
    totalTimeMs: 0,
  };
}

export async function createDemoAccount({ displayName, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  if (!displayName?.trim() || !normalizedEmail || !password || !VALID_ROLES.has(role)) {
    throw new Error('Invalid demo account details.');
  }
  if (inMemorySandboxAccounts.has(normalizedEmail)) {
    throw new Error('A sandbox session with this email is already active in this tab.');
  }

  const salt = crypto.randomUUID();
  const passwordHash = await saltedPasswordDigest(password, salt);
  const account = initializeProgress({
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    email: normalizedEmail,
    role,
    salt,
    passwordHash,
  });

  inMemorySandboxAccounts.set(normalizedEmail, account);
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: normalizedEmail }));
  } catch {
    // SessionStorage disabled or restricted
  }
  return publicAccount(account);
}

export async function signInDemoAccount({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const account = inMemorySandboxAccounts.get(normalizedEmail);
  if (!account) {
    // If not in memory, create an on-the-fly sandbox persona for demonstration
    const fallbackAccount = initializeProgress({
      id: crypto.randomUUID(),
      displayName: normalizedEmail.split('@')[0] || 'Demo Learner',
      email: normalizedEmail,
      role: 'student',
      salt: crypto.randomUUID(),
      passwordHash: 'sandbox',
    });
    inMemorySandboxAccounts.set(normalizedEmail, fallbackAccount);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: normalizedEmail }));
    } catch {
      /* noop */
    }
    return publicAccount(fallbackAccount);
  }

  const computedHash = await saltedPasswordDigest(password, account.salt);
  if (account.passwordHash !== computedHash && account.passwordHash !== 'sandbox') {
    throw new Error('Incorrect email or password.');
  }

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: normalizedEmail }));
  } catch {
    /* noop */
  }
  return publicAccount(account);
}

export function clearDemoSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
