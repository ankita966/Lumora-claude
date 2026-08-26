-- Lumora Phase 1 follow-up: backfill pre-migration users and provide a
-- school-admin-only registration list. This migration has no client-side
-- privileged writes and preserves all existing roles.

-- Make the signup trigger idempotent. New Auth users are still assigned only
-- the student role; a duplicate trigger invocation cannot fail their signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

-- One-time backfill for accounts created before the original signup trigger.
insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'display_name', split_part(users.email, '@', 1))
from auth.users as users
on conflict (id) do nothing;

-- Only accounts that have no role record receive student. Existing teacher,
-- parent, specialist, and school_admin records are left completely unchanged.
insert into public.user_roles (user_id, role)
select profiles.id, 'student'::public.app_role
from public.profiles as profiles
where not exists (
  select 1 from public.user_roles as roles where roles.user_id = profiles.id
)
on conflict (user_id, role) do nothing;

-- Auth metadata is never exposed through a public table. This function is the
-- narrow, admin-only server-side bridge needed for the Admin Users view.
create or replace function public.list_registered_users()
returns table (
  id uuid,
  display_name text,
  email text,
  roles public.app_role[],
  created_at timestamptz,
  last_sign_in_at timestamptz,
  account_status text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    users.id,
    profiles.display_name,
    users.email,
    coalesce(array_agg(user_roles.role order by user_roles.role) filter (where user_roles.role is not null), '{}'::public.app_role[]),
    users.created_at,
    users.last_sign_in_at,
    case
      when users.banned_until is not null and users.banned_until > now() then 'suspended'
      when users.email_confirmed_at is null then 'pending confirmation'
      else 'active'
    end
  from auth.users as users
  join public.profiles as profiles on profiles.id = users.id
  left join public.user_roles on user_roles.user_id = users.id
  where exists (
    select 1 from public.user_roles as viewer_roles
    where viewer_roles.user_id = auth.uid() and viewer_roles.role = 'school_admin'
  )
  group by users.id, profiles.display_name, users.email, users.created_at, users.last_sign_in_at, users.banned_until, users.email_confirmed_at
  order by users.created_at desc;
$$;

revoke all on function public.list_registered_users() from public;
grant execute on function public.list_registered_users() to authenticated;
