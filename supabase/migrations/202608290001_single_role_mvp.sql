-- Lumora MVP: each account has exactly one database role and one portal.
-- Preserve an existing privileged role over the baseline student role while
-- retaining superseded legacy grants for audit before normalizing the active
-- role row.

create table public.user_role_history (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  archived_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_role_history enable row level security;

with ranked_roles as (
  select
    ctid,
    row_number() over (
      partition by user_id
      order by case role
        when 'school_admin' then 1
        when 'specialist' then 2
        when 'teacher' then 3
        when 'parent' then 4
        when 'student' then 5
      end
    ) as role_rank
  from public.user_roles
)
insert into public.user_role_history (user_id, role)
select roles.user_id, roles.role
from public.user_roles roles
join ranked_roles on ranked_roles.ctid = roles.ctid
where ranked_roles.role_rank > 1
on conflict (user_id, role) do nothing;

with ranked_roles as (
  select
    ctid,
    row_number() over (
      partition by user_id
      order by case role
        when 'school_admin' then 1
        when 'specialist' then 2
        when 'teacher' then 3
        when 'parent' then 4
        when 'student' then 5
      end
    ) as role_rank
  from public.user_roles
)
delete from public.user_roles roles
using ranked_roles
where roles.ctid = ranked_roles.ctid
  and ranked_roles.role_rank > 1;

alter table public.user_roles drop constraint user_roles_pkey;
alter table public.user_roles add primary key (user_id);

-- The first-time signup portal is stored once, server-side, by the Auth
-- trigger. The old access-request table may remain for future use but is not
-- part of the MVP flow.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  initial_role public.app_role;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  case new.raw_user_meta_data ->> 'requested_portal'
    when 'teacher' then initial_role := 'teacher';
    when 'parent' then initial_role := 'parent';
    when 'school_admin' then initial_role := 'school_admin';
    when 'specialist' then initial_role := 'specialist';
    else initial_role := 'student';
  end case;

  insert into public.user_roles (user_id, role)
  values (new.id, initial_role)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
