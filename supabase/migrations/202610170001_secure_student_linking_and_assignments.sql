-- Secure parent pairing and trusted educator assignment.
-- Relationship rows are written only by narrowly scoped SECURITY DEFINER RPCs;
-- browser clients receive no direct INSERT policy on either relationship table.

create table public.student_link_codes (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.student_link_codes enable row level security;

create or replace function public.create_student_link_code()
returns table (link_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_code text := replace(gen_random_uuid()::text, '-', '');
  v_expiration timestamptz := now() + interval '30 minutes';
begin
  if v_student_id is null or not public.has_role('student') then
    raise exception 'An authenticated student account is required.' using errcode = '42501';
  end if;

  delete from public.student_link_codes as codes
  where codes.student_id = v_student_id or codes.expires_at <= now();

  insert into public.student_link_codes (student_id, code_hash, expires_at)
  values (v_student_id, md5(lower(v_code)), v_expiration);

  return query select v_code, v_expiration;
end;
$$;

create or replace function public.claim_student_link_code(p_link_code text)
returns table (student_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_display_name text;
  v_code text := regexp_replace(lower(coalesce(p_link_code, '')), '[^a-f0-9]', '', 'g');
begin
  if auth.uid() is null or not public.has_role('parent') then
    raise exception 'An authenticated parent account is required.' using errcode = '42501';
  end if;
  if length(v_code) <> 32 then
    raise exception 'Enter the 32-character family link code from the student account.' using errcode = '22023';
  end if;

  select codes.student_id into v_student_id
  from public.student_link_codes as codes
  where codes.code_hash = md5(v_code) and codes.expires_at > now()
  for update;

  if v_student_id is null then
    raise exception 'That link code is invalid or expired. Ask the learner to create a new one.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_roles as roles
    where roles.user_id = v_student_id and roles.role = 'student'
  ) then
    raise exception 'The account for this code is not a student account.' using errcode = '22023';
  end if;

  insert into public.student_guardians (student_id, parent_id)
  values (v_student_id, auth.uid())
  on conflict (student_id, parent_id) do nothing;

  delete from public.student_link_codes as codes where codes.student_id = v_student_id;
  select profiles.display_name into v_display_name
  from public.profiles as profiles where profiles.id = v_student_id;

  return query select v_student_id, coalesce(v_display_name, 'Learner');
end;
$$;

create or replace function public.assign_student_access(
  p_student_id uuid,
  p_grantee_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role('school_admin') then
    raise exception 'School-admin authorization is required to assign learners.' using errcode = '42501';
  end if;
  if p_role not in ('teacher', 'specialist') then
    raise exception 'Assignments can only be made to a teacher or specialist.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_roles as roles
    where roles.user_id = p_student_id and roles.role = 'student'
  ) then
    raise exception 'Choose an existing student account.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_roles as roles
    where roles.user_id = p_grantee_id and roles.role = p_role
  ) then
    raise exception 'Choose an existing account with the selected staff role.' using errcode = '22023';
  end if;

  insert into public.student_access_grants (student_id, grantee_id, role)
  values (p_student_id, p_grantee_id, p_role)
  on conflict (student_id, grantee_id, role) do nothing;
end;
$$;

revoke all on function public.create_student_link_code() from public;
revoke all on function public.claim_student_link_code(text) from public;
revoke all on function public.assign_student_access(uuid, uuid, public.app_role) from public;
grant execute on function public.create_student_link_code() to authenticated;
grant execute on function public.claim_student_link_code(text) to authenticated;
grant execute on function public.assign_student_access(uuid, uuid, public.app_role) to authenticated;
