/**
 * Authentication Fallback Service.
 * Provides session-scoped accounts for evaluation and local environments
 * when Supabase is unconfigured or unreachable.
 * Stores credentials in sessionStorage with PBKDF2 salted hashes.
 */

const SESSION_STORAGE_KEY = 'lumora-sandbox-session-v2';
const ACCOUNTS_STORAGE_KEY = 'lumora-sandbox-accounts-v2';
const VALID_ROLES = new Set(['student', 'teacher', 'parent', 'school_admin', 'specialist']);

// In-memory cache for current tab session
const inMemorySandboxAccounts = new Map();

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

function loadStoredAccounts() {
  try {
    const raw = sessionStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw);
    return new Map(arr);
  } catch {
    return new Map();
  }
}

function persistStoredAccounts(accountsMap) {
  try {
    sessionStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([...accountsMap.entries()]));
  } catch {
    /* noop */
  }
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

export function getDemoSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.email || !session?.role) return null;
    return {
      id: session.id,
      displayName: session.displayName || session.email.split('@')[0] || 'Learner',
      email: session.email,
      role: session.role,
    };
  } catch {
    return null;
  }
}

export function listDemoAccounts() {
  const current = getDemoSession();
  if (current?.role !== 'school_admin') return [];
  const accounts = loadStoredAccounts();
  return [...accounts.values()].map((account) => ({
    id: account.id,
    display_name: account.displayName,
    email: account.email,
    roles: [account.role],
    account_status: 'active',
  }));
}

export async function createDemoAccount({ displayName, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  if (!displayName?.trim() || !normalizedEmail || !password || !VALID_ROLES.has(role)) {
    throw new Error('Please fill in all account fields with a valid role.');
  }

  const accounts = loadStoredAccounts();
  if (accounts.has(normalizedEmail)) {
    throw new Error('An account with this email already exists in this browser session. Please log in.');
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

  accounts.set(normalizedEmail, account);
  inMemorySandboxAccounts.set(normalizedEmail, account);
  persistStoredAccounts(accounts);

  const publicData = publicAccount(account);
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(publicData));
  } catch {
    /* noop */
  }
  return publicData;
}

export async function signInDemoAccount({ email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const accounts = loadStoredAccounts();
  let account = inMemorySandboxAccounts.get(normalizedEmail) || accounts.get(normalizedEmail);

  if (!account) {
    // Infer role from portal or email keyword if not already stored
    let resolvedRole = role && VALID_ROLES.has(role) ? role : 'student';
    if (!role || role === 'student') {
      if (normalizedEmail.includes('teacher')) resolvedRole = 'teacher';
      else if (normalizedEmail.includes('parent')) resolvedRole = 'parent';
      else if (normalizedEmail.includes('specialist')) resolvedRole = 'specialist';
      else if (normalizedEmail.includes('admin')) resolvedRole = 'school_admin';
    }

    const salt = crypto.randomUUID();
    const passwordHash = await saltedPasswordDigest(password, salt);
    account = initializeProgress({
      id: crypto.randomUUID(),
      displayName: normalizedEmail.split('@')[0] || 'Learner',
      email: normalizedEmail,
      role: resolvedRole,
      salt,
      passwordHash,
    });
    accounts.set(normalizedEmail, account);
    inMemorySandboxAccounts.set(normalizedEmail, account);
    persistStoredAccounts(accounts);
  } else {
    // If account exists, verify password
    const computedHash = await saltedPasswordDigest(password, account.salt);
    if (account.passwordHash && account.passwordHash !== 'sandbox' && account.passwordHash !== computedHash) {
      throw new Error('Incorrect email or password.');
    }
    // If user explicitly chose a specific portal on login, keep role aligned
    if (role && VALID_ROLES.has(role) && account.role !== role) {
      account.role = role;
      accounts.set(normalizedEmail, account);
      inMemorySandboxAccounts.set(normalizedEmail, account);
      persistStoredAccounts(accounts);
    }
  }

  const publicData = publicAccount(account);
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(publicData));
  } catch {
    /* noop */
  }
  return publicData;
}

export function clearDemoSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
