-- Trusted provisioning is performed by the provision-user Edge Function.
-- Browser users receive no policy that can create or alter roles.

create table public.admin_provisioning_audit (
  id uuid primary key default gen_random_uuid(),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_email text not null,
  assigned_role public.app_role not null check (assigned_role in ('teacher', 'parent', 'specialist', 'school_admin')),
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now()
);

create index admin_provisioning_audit_invited_by_idx on public.admin_provisioning_audit (invited_by, created_at desc);

alter table public.admin_provisioning_audit enable row level security;
-- Deliberately no browser policies: this is a server-side audit record.
