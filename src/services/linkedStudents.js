import { supabase } from '../lib/supabase';

const MAX_ATTEMPTS_PER_VIEW = 200;

function toActivity(attempt) {
  return {
    world: attempt.world_key,
    round: attempt.round_number,
    skill: attempt.skill,
    accuracy: Number(attempt.accuracy),
    attempts: attempt.attempts,
    timeMs: attempt.time_ms,
    ts: new Date(attempt.created_at).getTime(),
  };
}

/**
 * Read-only progress view for students already linked to the signed-in viewer.
 * RLS and the relationship tables remain the authority for every returned row.
 */
export async function loadLinkedStudents(viewerId, relationship) {
  if (!supabase || !viewerId) return [];
  const relationQuery = relationship === 'parent'
    ? supabase.from('student_guardians').select('student_id').eq('parent_id', viewerId)
    : supabase.from('student_access_grants').select('student_id').eq('grantee_id', viewerId).eq('role', relationship);
  const { data: links, error: linksError } = await relationQuery;
  if (linksError) throw linksError;

  const studentIds = [...new Set((links ?? []).map((link) => link.student_id))];
  if (!studentIds.length) return [];

  const [profilesResult, progressResult, attemptsResult] = await Promise.all([
    supabase.from('profiles').select('id, display_name').in('id', studentIds),
    supabase.from('student_world_progress').select('student_id, world_key, completed, xp_total, sessions_completed, total_time_ms, updated_at').in('student_id', studentIds),
    supabase.from('round_attempts').select('student_id, world_key, round_number, skill, accuracy, attempts, time_ms, created_at').in('student_id', studentIds).order('created_at', { ascending: false }).limit(MAX_ATTEMPTS_PER_VIEW),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (progressResult.error) throw progressResult.error;
  if (attemptsResult.error) throw attemptsResult.error;

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
    };
  });
}
