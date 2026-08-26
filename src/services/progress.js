import { supabase } from '../lib/supabase';

const MAX_ACTIVITY_LOG = 200;

function activityFromAttempt(attempt) {
  return { world: attempt.world_key, round: attempt.round_number, skill: attempt.skill, accuracy: Number(attempt.accuracy), attempts: attempt.attempts, timeMs: attempt.time_ms, ts: new Date(attempt.created_at).getTime() };
}

// Reads only after an authenticated student session exists. Callers catch errors
// so local Zustand/localStorage remains fully usable when offline.
export async function loadStudentProgress(studentId) {
  if (!supabase || !studentId) return null;
  const [{ data: worlds, error: worldsError }, { data: attempts, error: attemptsError }] = await Promise.all([
    supabase.from('student_world_progress').select('*').eq('student_id', studentId),
    supabase.from('round_attempts').select('world_key, round_number, skill, accuracy, attempts, time_ms, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(MAX_ACTIVITY_LOG),
  ]);
  if (worldsError) throw worldsError;
  if (attemptsError) throw attemptsError;
  if (!worlds?.length && !attempts?.length) return null;
  const latest = [...(worlds ?? [])].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  return {
    xp: latest?.xp_total,
    sessionsCompleted: latest?.sessions_completed,
    totalTimeMs: latest?.total_time_ms,
    worldsCompleted: Object.fromEntries((worlds ?? []).filter((world) => world.completed).map((world) => [world.world_key, true])),
    activityLog: [...(attempts ?? [])].reverse().map(activityFromAttempt),
  };
}

export async function startGameSession(studentId, worldKey) {
  if (!supabase || !studentId) return null;
  const { data, error } = await supabase.from('game_sessions').insert({ student_id: studentId, world_key: worldKey }).select('id').single();
  if (error) throw error;
  return data.id;
}

// Fire-and-forget from gameplay. A failed network write never affects play.
export async function syncRoundAttempt(studentId, attempt, snapshot) {
  if (!supabase || !studentId) return;
  const { world_completed: worldCompleted, ...attemptRow } = attempt;
  const { error: attemptError } = await supabase.from('round_attempts').insert({ student_id: studentId, ...attemptRow });
  if (attemptError) throw attemptError;
  const { error: progressError } = await supabase.from('student_world_progress').upsert({
    student_id: studentId, world_key: attempt.world_key, rounds_completed: attempt.round_number,
    completed: worldCompleted, xp_total: snapshot.xp, sessions_completed: snapshot.sessionsCompleted,
    total_time_ms: snapshot.totalTimeMs, updated_at: new Date().toISOString(),
  });
  if (progressError) throw progressError;
  if (worldCompleted && attempt.session_id) {
    const { error: sessionError } = await supabase.from('game_sessions').update({ completed_at: new Date().toISOString() }).eq('id', attempt.session_id).eq('student_id', studentId);
    if (sessionError) throw sessionError;
  }
}

// First authenticated play retains pre-auth local progress without inventing attempts.
export async function seedLocalProgress(studentId, snapshot) {
  if (!supabase || !studentId || !Object.keys(snapshot.worldsCompleted ?? {}).length) return;
  const rows = Object.keys(snapshot.worldsCompleted).map((worldKey) => ({
    student_id: studentId, world_key: worldKey, rounds_completed: 5, completed: true,
    xp_total: snapshot.xp, sessions_completed: snapshot.sessionsCompleted, total_time_ms: snapshot.totalTimeMs,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('student_world_progress').upsert(rows);
  if (error) throw error;
}
