-- Lumora Enterprise Hardening & Server-Authoritative Scoring Migration
-- Patches privilege escalation, restores multi-role RBAC, and introduces atomic server-side scoring RPC.

-- 1. Restore composite primary key on user_roles for multi-role accounts
alter table public.user_roles drop constraint if exists user_roles_pkey;
alter table public.user_roles add primary key (user_id, role);

-- 2. Secure Auth Trigger: Prevent unauthenticated users from self-assigning privileged roles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  initial_role public.app_role := 'student';
  req_role text;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set display_name = excluded.display_name;

  req_role := new.raw_user_meta_data ->> 'requested_portal';
  -- Only unprivileged roles (student, parent) are permitted during public self-signup.
  -- Privileged roles (school_admin, teacher, specialist) must be assigned via invite/provisioning.
  if req_role = 'parent' then
    initial_role := 'parent';
  else
    initial_role := 'student';
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, initial_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- 3. Server-Authoritative Scoring and Progress Accumulation RPC
create or replace function public.submit_round_attempt(
  p_world_key text,
  p_round_number integer,
  p_skill text,
  p_accuracy numeric,
  p_attempts integer,
  p_time_ms integer,
  p_world_completed boolean default false,
  p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_xp_earned integer := 0;
  v_attempt_id uuid;
  v_clamped_accuracy numeric;
begin
  if v_student_id is null then
    raise exception 'Authentication required to submit progress.';
  end if;

  -- Clamp accuracy to [0.0, 1.0]
  v_clamped_accuracy := greatest(0.0, least(1.0, coalesce(p_accuracy, 0.0)));
  
  -- Calculate XP earned on server (base XP + accuracy multiplier + world completion bonus)
  v_xp_earned := greatest(10, round(50 * v_clamped_accuracy) + case when p_world_completed then 100 else 0 end);

  -- Insert attempt record into ledger
  insert into public.round_attempts (
    student_id, session_id, world_key, round_number, skill, accuracy, attempts, time_ms, xp_earned, completion_status
  ) values (
    v_student_id, p_session_id, p_world_key, p_round_number, p_skill, v_clamped_accuracy, greatest(1, p_attempts), greatest(0, p_time_ms), v_xp_earned, 'completed'
  ) returning id into v_attempt_id;

  -- Atomically accumulate progress in student_world_progress to avoid multi-device race conditions
  insert into public.student_world_progress (
    student_id, world_key, rounds_completed, completed, xp_total, sessions_completed, total_time_ms, updated_at
  ) values (
    v_student_id, p_world_key, p_round_number, p_world_completed, v_xp_earned, case when p_world_completed then 1 else 0 end, p_time_ms, now()
  )
  on conflict (student_id, world_key) do update set
    rounds_completed = greatest(student_world_progress.rounds_completed, excluded.rounds_completed),
    completed = student_world_progress.completed or excluded.completed,
    xp_total = student_world_progress.xp_total + excluded.xp_total,
    sessions_completed = student_world_progress.sessions_completed + excluded.sessions_completed,
    total_time_ms = student_world_progress.total_time_ms + excluded.total_time_ms,
    updated_at = now();

  -- Mark game session completed if world finished
  if p_world_completed and p_session_id is not null then
    update public.game_sessions
    set completed_at = now()
    where id = p_session_id and student_id = v_student_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'xp_earned', v_xp_earned
  );
end;
$$;

grant execute on function public.submit_round_attempt to authenticated;
