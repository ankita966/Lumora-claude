import { supabase } from '../lib/supabase.js';

const MAX_ATTEMPTS_PER_VIEW = 200;

function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Creates a unique, secure student linking code backed by Supabase.
 * Generates and stores the code server-side via the `create_student_link_code` RPC.
 * Never simulates or stores codes in localStorage.
 */
export async function createStudentLinkCode() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.rpc('create_student_link_code');
  if (error) {
    throw new Error(error.message || 'Unable to generate student link code.');
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.link_code) {
    throw new Error('No link code was returned by the database.');
  }

  return {
    link_code: result.link_code,
    expires_at: result.expires_at,
  };
}

/**
 * Claims a student link code for an authorized parent, teacher, or specialist account.
 * Server-side validation via `claim_student_link_code` RPC enforces:
 * - Authentication & caller role authorization (parent, teacher, specialist)
 * - Expiration check (30-minute window)
 * - Single-use consumption (code record deleted upon successful claim)
 * - Persistence to student_guardians or student_access_grants
 * Never simulates claiming or links using localStorage.
 */
export async function claimStudentLinkCode(rawCode) {
  const clean = normalizeCode(rawCode);
  if (!clean) {
    throw new Error('Please enter a valid student link code.');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.rpc('claim_student_link_code', {
    p_link_code: rawCode.trim(),
  });

  if (error) {
    throw new Error(error.message || 'Unable to claim student link code.');
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.student_id) {
    throw new Error('That link code is invalid or expired. Ask the learner to create a new one.');
  }

  return {
    student_id: result.student_id,
    display_name: result.display_name || 'Learner',
  };
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
 * Strictly queries Supabase authenticated relationships and RLS-protected tables:
 * - Parents query via student_guardians
 * - Teachers & specialists query via student_access_grants
 * Returns empty array when unlinked. Zero localStorage fallback.
 */
export async function loadLinkedStudents(viewerId, relationship) {
  if (!supabase || !viewerId) {
    return [];
  }

  try {
    const relationQuery = relationship === 'parent'
      ? supabase.from('student_guardians').select('student_id').eq('parent_id', viewerId)
      : supabase.from('student_access_grants').select('student_id').eq('grantee_id', viewerId).eq('role', relationship);

    const { data: links, error: linksError } = await relationQuery;

    if (linksError || !links?.length) {
      return [];
    }

    const studentIds = [...new Set(links.map((link) => link.student_id))];
    const [profilesResult, progressResult, attemptsResult, sessionsResult] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', studentIds),
      supabase.from('student_world_progress').select('student_id, world_key, completed, xp_total, sessions_completed, total_time_ms, updated_at').in('student_id', studentIds),
      supabase.from('round_attempts').select('student_id, session_id, world_key, round_number, skill, accuracy, attempts, time_ms, created_at').in('student_id', studentIds).order('created_at', { ascending: false }).limit(MAX_ATTEMPTS_PER_VIEW),
      supabase.from('game_sessions').select('id, student_id, world_key, started_at, completed_at').in('student_id', studentIds).order('started_at', { ascending: false }).limit(MAX_ATTEMPTS_PER_VIEW),
    ]);

    if (profilesResult.error || progressResult.error) {
      return [];
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

    return studentIds.map((id) => {
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
  } catch (err) {
    console.error('[loadLinkedStudents] Failed to load linked students:', err);
    return [];
  }
}
