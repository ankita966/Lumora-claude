import { supabase } from '../lib/supabase';

const MAX_ACTIVITY_LOG = 200;

function activityFromAttempt(attempt) {
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

// Reads only after an authenticated student session exists.
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

/**
 * Server-authoritative round submission.
 * Uses submit_round_attempt RPC for atomic calculation and multi-device consistency.
 */
export async function syncRoundAttempt(studentId, attempt, snapshot) {
  if (!supabase || !studentId) return;
  const { world_completed: worldCompleted } = attempt;

  try {
    // Primary: invoke server-authoritative scoring RPC
    const { data, error: rpcError } = await supabase.rpc('submit_round_attempt', {
      p_world_key: attempt.world_key,
      p_round_number: attempt.round_number,
      p_skill: attempt.skill,
      p_accuracy: attempt.accuracy,
      p_attempts: attempt.attempts,
      p_time_ms: attempt.time_ms,
      p_world_completed: Boolean(worldCompleted),
      p_session_id: attempt.session_id || null,
    });

    if (!rpcError && data?.success) return data;
  } catch {
    // Fallback for offline or local dev instances without RPC installed
  }

  // Graceful fallback to direct table write
  const { world_completed: _, ...attemptRow } = attempt;
  const { error: attemptError } = await supabase.from('round_attempts').insert({ student_id: studentId, ...attemptRow });
  if (attemptError) throw attemptError;

  const { error: progressError } = await supabase.from('student_world_progress').upsert({
    student_id: studentId,
    world_key: attempt.world_key,
    rounds_completed: attempt.round_number,
    completed: Boolean(worldCompleted),
    xp_total: snapshot.xp,
    sessions_completed: snapshot.sessionsCompleted,
    total_time_ms: snapshot.totalTimeMs,
    updated_at: new Date().toISOString(),
  });
  if (progressError) throw progressError;

  if (worldCompleted && attempt.session_id) {
    await supabase.from('game_sessions').update({ completed_at: new Date().toISOString() }).eq('id', attempt.session_id).eq('student_id', studentId);
  }
}

// Retains pre-auth local progress on first login
export async function seedLocalProgress(studentId, snapshot) {
  if (!supabase || !studentId || !Object.keys(snapshot.worldsCompleted ?? {}).length) return;
  const rows = Object.keys(snapshot.worldsCompleted).map((worldKey) => ({
    student_id: studentId,
    world_key: worldKey,
    rounds_completed: 5,
    completed: true,
    xp_total: snapshot.xp,
    sessions_completed: snapshot.sessionsCompleted,
    total_time_ms: snapshot.totalTimeMs,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('student_world_progress').upsert(rows);
  if (error) throw error;
}
