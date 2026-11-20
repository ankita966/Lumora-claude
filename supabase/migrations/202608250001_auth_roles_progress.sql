-- Lumora Phase 1: identity, authorization, and student game progress.
-- Apply through the Supabase CLI or SQL Editor. Never place a service-role key
-- in the browser; roles and relationships are administered by a trusted admin.

create type public.app_role as enum ('student', 'teacher', 'parent', 'school_admin', 'specialist');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.school_memberships (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null check (role in ('teacher', 'school_admin')),
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);
create table public.student_guardians (
  student_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, parent_id),
  check (student_id <> parent_id)
);
create table public.student_access_grants (
  student_id uuid not null references public.profiles(id) on delete cascade,
  grantee_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null check (role in ('teacher', 'specialist')),
  created_at timestamptz not null default now(),
  primary key (student_id, grantee_id, role),
  check (student_id <> grantee_id)
);
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  world_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);
create table public.round_attempts (
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
create index round_attempts_student_created_idx on public.round_attempts (student_id, created_at desc);
create index game_sessions_student_started_idx on public.game_sessions (student_id, started_at desc);
create table public.student_world_progress (
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

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger schools_set_updated_at before update on public.schools for each row execute procedure public.set_updated_at();

-- New self-service accounts start as students. There is deliberately no client
-- INSERT/UPDATE policy on user_roles, so a user cannot promote themself.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = required_role);
$$;
create or replace function public.is_school_admin_for(target_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.school_memberships
    where school_id = target_school and user_id = auth.uid() and role = 'school_admin'
  );
$$;
-- SECURITY DEFINER evaluates relationships without exposing them through broad policies.
create or replace function public.can_access_student(target_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() = target_student
    or exists (select 1 from public.student_guardians where student_id = target_student and parent_id = auth.uid())
    or exists (select 1 from public.student_access_grants where student_id = target_student and grantee_id = auth.uid())
    or exists (
      select 1 from public.school_memberships viewer
      join public.school_memberships student on student.school_id = viewer.school_id
      where viewer.user_id = auth.uid() and viewer.role = 'school_admin' and student.user_id = target_student
    );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_access_grants enable row level security;
alter table public.game_sessions enable row level security;
alter table public.round_attempts enable row level security;
alter table public.student_world_progress enable row level security;

create policy "profiles self or authorized viewer read" on public.profiles for select using (id = auth.uid() or public.can_access_student(id));
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "roles self read" on public.user_roles for select using (user_id = auth.uid());
create policy "schools member read" on public.schools for select using (exists (select 1 from public.school_memberships where school_id = schools.id and user_id = auth.uid()));
create policy "memberships self or school admin read" on public.school_memberships for select using (user_id = auth.uid() or public.is_school_admin_for(school_id));
create policy "guardians linked people read" on public.student_guardians for select using (student_id = auth.uid() or parent_id = auth.uid() or public.can_access_student(student_id));
create policy "grants linked people read" on public.student_access_grants for select using (student_id = auth.uid() or grantee_id = auth.uid() or public.can_access_student(student_id));
create policy "sessions authorized viewers read" on public.game_sessions for select using (public.can_access_student(student_id));
create policy "sessions students insert" on public.game_sessions for insert with check (student_id = auth.uid());
create policy "sessions students update" on public.game_sessions for update using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "attempts authorized viewers read" on public.round_attempts for select using (public.can_access_student(student_id));
create policy "attempts students insert" on public.round_attempts for insert with check (
  student_id = auth.uid()
  and (session_id is null or exists (
    select 1 from public.game_sessions
    where id = session_id and student_id = auth.uid()
  ))
);
create policy "world progress authorized viewers read" on public.student_world_progress for select using (public.can_access_student(student_id));
create policy "world progress students insert" on public.student_world_progress for insert with check (student_id = auth.uid());
create policy "world progress students update" on public.student_world_progress for update using (student_id = auth.uid()) with check (student_id = auth.uid());
