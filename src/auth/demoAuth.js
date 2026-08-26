const ACCOUNTS_KEY = 'lumora-demo-accounts-v1';
const SESSION_KEY = 'lumora-demo-session-v1';
const VALID_ROLES = new Set(['student', 'teacher', 'parent', 'school_admin', 'specialist']);

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function passwordDigest(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function publicAccount(account) {
  return { id: account.id, displayName: account.displayName, email: account.email, role: account.role };
}

export function getDemoSession() {
  const session = read(SESSION_KEY, null);
  if (!session?.email) return null;
  const account = read(ACCOUNTS_KEY, {})[normalizeEmail(session.email)];
  return account ? publicAccount(account) : null;
}

export async function createDemoAccount({ displayName, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  if (!displayName?.trim() || !normalizedEmail || !password || !VALID_ROLES.has(role)) throw new Error('Invalid demo account details.');
  const accounts = read(ACCOUNTS_KEY, {});
  if (accounts[normalizedEmail]) throw new Error('An account with this email already exists. Please log in.');
  const account = {
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    email: normalizedEmail,
    role,
    passwordHash: await passwordDigest(password),
  };
  accounts[normalizedEmail] = account;
  write(ACCOUNTS_KEY, accounts);
  write(SESSION_KEY, { email: normalizedEmail });
  return publicAccount(account);
}

export async function signInDemoAccount({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const account = read(ACCOUNTS_KEY, {})[normalizedEmail];
  if (!account || account.passwordHash !== await passwordDigest(password)) throw new Error('Incorrect email or password.');
  write(SESSION_KEY, { email: normalizedEmail });
  return publicAccount(account);
}

export function clearDemoSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* localStorage unavailable */ }
}
