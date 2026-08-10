-- Additive RBAC foundation. Existing users.role remains the compatibility fallback.
create table public.access_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  category text not null default 'custom',
  data_scope jsonb not null default '{"type":"company"}'::jsonb,
  sensitive_permissions text[] not null default '{}',
  approval_level integer,
  status text not null default 'active' check (status in ('draft','active','inactive')),
  effective_from date not null default current_date,
  effective_to date,
  system_role boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,code),
  check(effective_to is null or effective_to>=effective_from)
);

create table public.access_role_permissions (
  role_id uuid not null references public.access_roles(id) on delete cascade,
  permission_code text not null,
  created_at timestamptz not null default now(),
  primary key(role_id,permission_code),
  check(permission_code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')
);

create table public.access_role_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid not null references public.access_roles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  data_scope jsonb not null default '{}'::jsonb,
  effective_from date not null default current_date,
  effective_to date,
  reason text not null,
  assigned_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique(role_id,user_id,effective_from),
  check(effective_to is null or effective_to>=effective_from)
);

create table public.access_audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references public.users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  result text not null default 'success',
  created_at timestamptz not null default now()
);

create index access_roles_company_status_idx on public.access_roles(company_id,status);
create index access_assignments_user_idx on public.access_role_assignments(company_id,user_id,effective_from,effective_to);
create index access_audit_company_idx on public.access_audit_events(company_id,created_at desc);

create trigger access_roles_set_updated_at before update on public.access_roles
for each row execute function public.set_updated_at();

alter table public.access_roles enable row level security;
alter table public.access_role_permissions enable row level security;
alter table public.access_role_assignments enable row level security;
alter table public.access_audit_events enable row level security;

create policy access_roles_admin_read on public.access_roles for select
using (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy access_permissions_admin_read on public.access_role_permissions for select
using (role_id in (select id from public.access_roles where company_id=public.jwt_company_id()) and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy access_assignments_admin_read on public.access_role_assignments for select
using (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy access_assignments_self_read on public.access_role_assignments for select
using (user_id=(select id from public.users where auth_user_id=auth.uid()));
create policy access_audit_admin_read on public.access_audit_events for select
using (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

-- Writes intentionally go through audited server actions using the service role.
revoke update, delete on public.access_audit_events from authenticated;

