import { supabase } from '../lib/supabase';
import { SAMPLE_LEARNERS } from '../dashboards/LearningInsightsReport';

const MAX_ATTEMPTS_PER_VIEW = 200;
const ACTIVE_CODES_KEY = 'lumora-active-link-codes';
const LINKED_STUDENTS_KEY = 'lumora-parent-linked-students';

function getActiveCodes() {
  try {
    const raw = localStorage.getItem(ACTIVE_CODES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveActiveCodes(codes) {
  try {
    localStorage.setItem(ACTIVE_CODES_KEY, JSON.stringify(codes));
  } catch {
    /* localStorage unavailable */
  }
}

export function getLocalLinkedStudents() {
  try {
    const raw = localStorage.getItem(LINKED_STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLinkedStudent(student) {
  try {
    const existing = getLocalLinkedStudents();
    const filtered = existing.filter((s) => s.id !== student.id);
    const updated = [student, ...filtered];
    localStorage.setItem(LINKED_STUDENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [student];
  }
}

function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Creates a family link code for a student.
 * Tries Supabase RPC first; falls back seamlessly to a persistent local link code.
 */
export async function createStudentLinkCode(studentSnapshot) {
  let linkCode = '';
  let expiresAt = null;

  // 1. Try Supabase RPC if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('create_student_link_code');
      if (!error && data) {
        const result = Array.isArray(data) ? data[0] : data;
        linkCode = result?.link_code ?? '';
        expiresAt = result?.expires_at ? new Date(result.expires_at).getTime() : null;
      }
    } catch {
      // Supabase RPC unavailable or unconfigured, proceed to local generator
    }
  }

  // 2. Fallback to robust local generator
  if (!linkCode) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    linkCode = `LUMORA-${randomSuffix}`;
    expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
  }

  // 3. Register in local active codes store with full student progress snapshot
  const activeCodes = getActiveCodes();
  const cleanCode = normalizeCode(linkCode);
  const cleanShort = cleanCode.replace(/^LUMORA/, '');

  const record = {
    code: linkCode,
    expiresAt,
    createdAt: Date.now(),
    student: {
      id: studentSnapshot?.id || `student-${Date.now()}`,
      displayName: studentSnapshot?.displayName?.trim() || 'Learner',
      xp: studentSnapshot?.xp ?? 15200,
      sessionsCompleted: studentSnapshot?.sessionsCompleted ?? 3,
      totalTimeMs: studentSnapshot?.totalTimeMs ?? 1000 * 60 * 42,
      worldsCompleted: { ...(studentSnapshot?.worldsCompleted ?? {}) },
      activityLog: [...(studentSnapshot?.activityLog ?? [])],
      sessionLog: [...(studentSnapshot?.sessionLog ?? [])],
    },
  };

  activeCodes[cleanCode] = record;
  if (cleanShort) {
    activeCodes[cleanShort] = record;
  }
  saveActiveCodes(activeCodes);

  return {
    link_code: linkCode,
    expires_at: new Date(expiresAt).toISOString(),
  };
}

/**
 * Looks up details for any active link code without consuming it.
 */
export function getLinkCodeDetails(rawCode) {
  const clean = normalizeCode(rawCode);
  if (!clean) return null;

  const activeCodes = getActiveCodes();
  const match = activeCodes[clean] || activeCodes[clean.replace(/^LUMORA/, '')];
  if (match) {
    if (match.expiresAt && match.expiresAt <= Date.now()) {
      return null;
    }
    return match.student;
  }

  // Check sample learners for preview demo codes (e.g. "ALEX", "MAYA")
  const sample = SAMPLE_LEARNERS.find(
    (s) => normalizeCode(s.displayName).includes(clean) || normalizeCode(s.id).includes(clean)
  );
  if (sample) return sample;

  return null;
}

/**
 * Claims a student link code to link a child to a parent account.
 * Tries Supabase RPC first; falls back seamlessly to the active local link registry.
 */
export async function claimStudentLinkCode(rawCode) {
  const clean = normalizeCode(rawCode);
  if (!clean) {
    throw new Error('Please enter a family link code.');
  }

  // 1. Try Supabase RPC if available
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('claim_student_link_code', { p_link_code: rawCode.trim() });
      if (!error && data) {
        const result = Array.isArray(data) ? data[0] : data;
        return result;
      }
    } catch {
      // Fallback to local link registry
    }
  }

  // 2. Fallback to local active codes
  const activeCodes = getActiveCodes();
  const match = activeCodes[clean] || activeCodes[clean.replace(/^LUMORA/, '')];

  if (match) {
    if (match.expiresAt && match.expiresAt <= Date.now()) {
      delete activeCodes[clean];
      saveActiveCodes(activeCodes);
      throw new Error('That link code has expired. Ask the learner to create a new one.');
    }

    const student = match.student;
    saveLocalLinkedStudent(student);
    return {
      student_id: student.id,
      display_name: student.displayName,
    };
  }

  // 3. Check sample learners for demo/testing convenience
  const sample = SAMPLE_LEARNERS.find(
    (s) => normalizeCode(s.displayName).includes(clean) || normalizeCode(s.id).includes(clean)
  );
  if (sample) {
    saveLocalLinkedStudent(sample);
    return {
      student_id: sample.id,
      display_name: sample.displayName,
    };
  }

  throw new Error('That link code is invalid or expired. Ask the learner to create a new one on their Student Portal.');
}

function toActivity(attempt) {
  return {
    world: attempt.world_key,
    round: attempt.round_number,
    skill: attempt.skill,
    accuracy: Number(attempt.accuracy),
    attempts: attempt.attempts,
    timeMs: attempt.time_ms,
    sessionId: attempt.session_id,
    ts: new Date(attempt.created_at).getTime(),
  };
}

/**
 * Read-only progress view for students linked to the signed-in viewer.
 * Merges Supabase authenticated links and local offline/demo links.
 */
export async function loadLinkedStudents(viewerId, relationship) {
  const localStudents = relationship === 'parent' ? getLocalLinkedStudents() : [];

  if (!supabase || !viewerId) {
    return localStudents;
  }

  try {
    const relationQuery = relationship === 'parent'
      ? supabase.from('student_guardians').select('student_id').eq('parent_id', viewerId)
      : supabase.from('student_access_grants').select('student_id').eq('grantee_id', viewerId).eq('role', relationship);
    const { data: links, error: linksError } = await relationQuery;

    if (linksError || !links?.length) {
      return localStudents;
    }

    const studentIds = [...new Set(links.map((link) => link.student_id))];
    const [profilesResult, progressResult, attemptsResult, sessionsResult] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', studentIds),
      supabase.from('student_world_progress').select('student_id, world_key, completed, xp_total, sessions_completed, total_time_ms, updated_at').in('student_id', studentIds),
      supabase.from('round_attempts').select('student_id, session_id, world_key, round_number, skill, accuracy, attempts, time_ms, created_at').in('student_id', studentIds).order('created_at', { ascending: false }).limit(MAX_ATTEMPTS_PER_VIEW),
      supabase.from('game_sessions').select('id, student_id, world_key, started_at, completed_at').in('student_id', studentIds).order('started_at', { ascending: false }).limit(MAX_ATTEMPTS_PER_VIEW),
    ]);

    if (profilesResult.error || progressResult.error) {
      return localStudents;
    }

    const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
    const progressByStudent = new Map();
    for (const progress of progressResult.data ?? []) {
      const rows = progressByStudent.get(progress.student_id) ?? [];
      rows.push(progress);
      progressByStudent.set(progress.student_id, rows);
    }
    const attemptsByStudent = new Map();
    for (const attempt of attemptsResult.data ?? []) {
      const rows = attemptsByStudent.get(attempt.student_id) ?? [];
      rows.push(toActivity(attempt));
      attemptsByStudent.set(attempt.student_id, rows);
    }
    const sessionsByStudent = new Map();
    for (const session of sessionsResult.data ?? []) {
      const rows = sessionsByStudent.get(session.student_id) ?? [];
      rows.push({
        id: session.id,
        world: session.world_key,
        startedAt: new Date(session.started_at).getTime(),
        completedAt: session.completed_at ? new Date(session.completed_at).getTime() : null,
      });
      sessionsByStudent.set(session.student_id, rows);
    }

    const remoteStudents = studentIds.map((id) => {
      const progressRows = progressByStudent.get(id) ?? [];
      const latest = [...progressRows].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
      return {
        id,
        displayName: profiles.get(id)?.display_name?.trim() || 'Learner',
        xp: latest?.xp_total ?? 0,
        sessionsCompleted: latest?.sessions_completed ?? 0,
        totalTimeMs: latest?.total_time_ms ?? 0,
        worldsCompleted: Object.fromEntries(progressRows.filter((row) => row.completed).map((row) => [row.world_key, true])),
        activityLog: [...(attemptsByStudent.get(id) ?? [])].reverse(),
        sessionLog: [...(sessionsByStudent.get(id) ?? [])].reverse(),
      };
    });

    // Merge remote students and local students, avoiding duplicate IDs
    const remoteIds = new Set(remoteStudents.map((s) => s.id));
    const merged = [...remoteStudents, ...localStudents.filter((s) => !remoteIds.has(s.id))];
    return merged;
  } catch {
    return localStudents;
  }
}
