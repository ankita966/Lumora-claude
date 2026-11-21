-- Migration: 202611210001_teacher_student_linking.sql
-- COMPLETE PRODUCTION STUDENT LINKING & ROLE SYSTEM
-- Safe, idempotent, non-destructive migration for Supabase.
-- Can be run safely on brand new or existing Supabase projects.

-- 1. Ensure public.app_role enum exists
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum ('student', 'teacher', 'parent', 'school_admin', 'specialist');
  end if;
end;
$$;

-- 2. Core Tables (if not exist)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

create table if not exists public.student_guardians (
  student_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, parent_id),
  check (student_id <> parent_id)
);

create table if not exists public.student_access_grants (
  student_id uuid not null references public.profiles(id) on delete cascade,
  grantee_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null check (role in ('teacher', 'specialist')),
  created_at timestamptz not null default now(),
  primary key (student_id, grantee_id, role),
  check (student_id <> grantee_id)
);

create table if not exists public.student_link_codes (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  world_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create table if not exists public.round_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.game_sessions(id) on delete set null,
  world_key text not null,
  round_number integer not null check (round_number > 0),
  skill text not null,
  accuracy numeric(4,3) not null check (accuracy between 0 and 1),
  attempts integer not null check (attempts > 0),
  time_ms integer not null check (time_ms >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  completion_status text not null default 'completed' check (completion_status in ('completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.student_world_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  world_key text not null,
  rounds_completed integer not null default 0 check (rounds_completed >= 0),
  completed boolean not null default false,
  xp_total integer not null default 0 check (xp_total >= 0),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  total_time_ms bigint not null default 0 check (total_time_ms >= 0),
  updated_at timestamptz not null default now(),
  primary key (student_id, world_key)
);

-- 3. Helper Functions: has_role (handles both app_role enum and text for maximum compatibility)
create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role::text = required_role
  );
$$;

create or replace function public.can_access_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_student
    or exists (select 1 from public.student_guardians where student_id = target_student and parent_id = auth.uid())
    or exists (select 1 from public.student_access_grants where student_id = target_student and grantee_id = auth.uid());
$$;

-- 4. Automatic User Provisioning Trigger (assigns role requested on signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_role public.app_role := 'student';
  req_role text;
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Explorer')
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(trim(excluded.display_name), ''), profiles.display_name),
    updated_at = now();

  req_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'requested_portal', '')));
  case req_role
    when 'teacher' then initial_role := 'teacher';
    when 'parent' then initial_role := 'parent';
    when 'specialist' then initial_role := 'specialist';
    when 'school_admin' then initial_role := 'school_admin';
    else initial_role := 'student';
  end case;

  insert into public.user_roles (user_id, role)
  values (new.id, initial_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles & roles for any pre-existing users without them
insert into public.profiles (id, display_name)
select users.id, coalesce(nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''), split_part(users.email, '@', 1), 'Explorer')
from auth.users as users
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select profiles.id, 'student'::public.app_role
from public.profiles as profiles
where not exists (
  select 1 from public.user_roles where user_id = profiles.id
)
on conflict (user_id, role) do nothing;

-- 5. RPC: create_student_link_code
create or replace function public.create_student_link_code()
returns table (link_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_raw text := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
  v_code text := 'LUMORA-' || v_raw;
  v_expiration timestamptz := now() + interval '30 minutes';
begin
  if v_student_id is null then
    raise exception 'An authenticated account is required.' using errcode = '42501';
  end if;

  if not (public.has_role('student') or public.has_role('student'::public.app_role)) then
    raise exception 'An authenticated student account is required.' using errcode = '42501';
  end if;

  -- Atomic clean: remove previous code for this student or any expired codes
  delete from public.student_link_codes as codes
  where codes.student_id = v_student_id or codes.expires_at <= now();

  insert into public.student_link_codes (student_id, code_hash, expires_at)
  values (v_student_id, md5(lower(v_raw)), v_expiration);

  return query select v_code, v_expiration;
end;
$$;

-- 6. RPC: claim_student_link_code
create or replace function public.claim_student_link_code(p_link_code text)
returns table (student_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_display_name text;
  v_caller_id uuid := auth.uid();
  v_code text := regexp_replace(lower(coalesce(p_link_code, '')), '[^a-z0-9]', '', 'g');
  v_raw text := regexp_replace(v_code, '^lumora', '');
  v_is_parent boolean;
  v_is_teacher boolean;
  v_is_specialist boolean;
begin
  if v_caller_id is null then
    raise exception 'An authenticated account is required.' using errcode = '42501';
  end if;

  v_is_parent := public.has_role('parent') or public.has_role('parent'::public.app_role);
  v_is_teacher := public.has_role('teacher') or public.has_role('teacher'::public.app_role);
  v_is_specialist := public.has_role('specialist') or public.has_role('specialist'::public.app_role);

  if not (v_is_parent or v_is_teacher or v_is_specialist) then
    raise exception 'An authorized parent, teacher, or specialist account is required.' using errcode = '42501';
  end if;

  if length(v_code) = 0 then
    raise exception 'Enter the link code from the student account.' using errcode = '22023';
  end if;

  -- Look up matching active link code (supports full code hash, 6-char suffix hash, and legacy 32-char hex)
  select codes.student_id into v_student_id
  from public.student_link_codes as codes
  where (codes.code_hash = md5(v_code) or codes.code_hash = md5(v_raw))
    and codes.expires_at > now()
  for update;

  if v_student_id is null then
    raise exception 'That link code is invalid or expired. Ask the learner to create a new one.' using errcode = '22023';
  end if;

  if v_caller_id = v_student_id then
    raise exception 'You cannot link your own account to yourself.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.user_roles as roles
    where roles.user_id = v_student_id and roles.role = 'student'
  ) then
    raise exception 'The account for this code is not a student account.' using errcode = '22023';
  end if;

  -- Assign relationship based on caller role
  if v_is_teacher then
    insert into public.student_access_grants (student_id, grantee_id, role)
    values (v_student_id, v_caller_id, 'teacher')
    on conflict (student_id, grantee_id, role) do nothing;
  elsif v_is_specialist then
    insert into public.student_access_grants (student_id, grantee_id, role)
    values (v_student_id, v_caller_id, 'specialist')
    on conflict (student_id, grantee_id, role) do nothing;
  elsif v_is_parent then
    insert into public.student_guardians (student_id, parent_id)
    values (v_student_id, v_caller_id)
    on conflict (student_id, parent_id) do nothing;
  end if;

  -- Consume code so it cannot be claimed twice
  delete from public.student_link_codes as codes where codes.student_id = v_student_id;

  select profiles.display_name into v_display_name
  from public.profiles as profiles where profiles.id = v_student_id;

  return query select v_student_id, coalesce(v_display_name, 'Learner');
end;
$$;

-- 7. Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_access_grants enable row level security;
alter table public.student_link_codes enable row level security;
alter table public.game_sessions enable row level security;
alter table public.round_attempts enable row level security;
alter table public.student_world_progress enable row level security;

drop policy if exists "profiles self or authorized viewer read" on public.profiles;
create policy "profiles self or authorized viewer read" on public.profiles for select using (id = auth.uid() or public.can_access_student(id));

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "roles self read" on public.user_roles;
create policy "roles self read" on public.user_roles for select using (user_id = auth.uid());

drop policy if exists "guardians linked people read" on public.student_guardians;
create policy "guardians linked people read" on public.student_guardians for select using (student_id = auth.uid() or parent_id = auth.uid() or public.can_access_student(student_id));

drop policy if exists "grants linked people read" on public.student_access_grants;
create policy "grants linked people read" on public.student_access_grants for select using (student_id = auth.uid() or grantee_id = auth.uid() or public.can_access_student(student_id));

drop policy if exists "sessions authorized viewers read" on public.game_sessions;
create policy "sessions authorized viewers read" on public.game_sessions for select using (public.can_access_student(student_id));

drop policy if exists "sessions students insert" on public.game_sessions;
create policy "sessions students insert" on public.game_sessions for insert with check (student_id = auth.uid());

drop policy if exists "sessions students update" on public.game_sessions;
create policy "sessions students update" on public.game_sessions for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "attempts authorized viewers read" on public.round_attempts;
create policy "attempts authorized viewers read" on public.round_attempts for select using (public.can_access_student(student_id));

drop policy if exists "attempts students insert" on public.round_attempts;
create policy "attempts students insert" on public.round_attempts for insert with check (student_id = auth.uid());

drop policy if exists "world progress authorized viewers read" on public.student_world_progress;
create policy "world progress authorized viewers read" on public.student_world_progress for select using (public.can_access_student(student_id));

drop policy if exists "world progress students insert" on public.student_world_progress;
create policy "world progress students insert" on public.student_world_progress for insert with check (student_id = auth.uid());

drop policy if exists "world progress students update" on public.student_world_progress;
create policy "world progress students update" on public.student_world_progress for update using (student_id = auth.uid()) with check (student_id = auth.uid());

-- 8. Grants and Schema Cache Reload
grant usage on schema public to anon, authenticated, service_role;
revoke all on function public.create_student_link_code() from public;
revoke all on function public.claim_student_link_code(text) from public;
grant execute on function public.create_student_link_code() to authenticated, anon, service_role;
grant execute on function public.claim_student_link_code(text) to authenticated, anon, service_role;
grant execute on function public.has_role(public.app_role) to authenticated, anon, service_role;
grant execute on function public.has_role(text) to authenticated, anon, service_role;
grant execute on function public.can_access_student(uuid) to authenticated, anon, service_role;

-- Force PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';
