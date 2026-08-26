-- Privileged portal onboarding: public signup may request access, but may
-- never assign a privileged role. A trusted administrator provisions roles
-- separately after reviewing the request.

create table public.role_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role public.app_role not null check (requested_role in ('parent', 'teacher', 'specialist', 'school_admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  unique (user_id, requested_role),
  check (reviewed_at is null or reviewed_at >= created_at)
);

alter table public.role_access_requests enable row level security;
create policy "access requests self read" on public.role_access_requests
  for select using (user_id = auth.uid());

-- The metadata is only an access-request context. It is never trusted to
-- grant a role. The existing student role remains the sole public signup role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role public.app_role;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  case new.raw_user_meta_data ->> 'requested_portal'
    when 'parent' then requested_role := 'parent';
    when 'teacher' then requested_role := 'teacher';
    when 'specialist' then requested_role := 'specialist';
    when 'school_admin' then requested_role := 'school_admin';
    else requested_role := null;
  end case;

  if requested_role is not null then
    insert into public.role_access_requests (user_id, requested_role)
    values (new.id, requested_role)
    on conflict (user_id, requested_role) do nothing;
  end if;
  return new;
end;
$$;
