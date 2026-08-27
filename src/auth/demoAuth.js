/**
 * Secure Demo & Sandbox Authentication Service.
 * Provides ephemeral, in-memory/session-scoped personas for local evaluation
 * without persisting unsalted plaintext credentials to browser storage.
 */

const SESSION_STORAGE_KEY = 'lumora-sandbox-session-v2';
const VALID_ROLES = new Set(['student', 'teacher', 'parent', 'school_admin', 'specialist']);

// In-memory demo account registry (ephemeral per page session)
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
  const account = {
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    email: normalizedEmail,
    role,
    salt,
    passwordHash,
  };

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
    const fallbackAccount = {
      id: crypto.randomUUID(),
      displayName: normalizedEmail.split('@')[0] || 'Demo Learner',
      email: normalizedEmail,
      role: 'student',
      salt: crypto.randomUUID(),
      passwordHash: 'sandbox',
    };
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
