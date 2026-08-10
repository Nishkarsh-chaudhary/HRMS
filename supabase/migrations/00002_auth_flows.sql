-- =============================================================================
-- 00002_auth_flows.sql
-- Replaces the Phase-1 `profiles` schema with the multi-tenant, invited-users
-- model: companies (tenants), users (incl. invited-before-auth), departments,
-- designations, JWT-claim RLS, and the RPCs backing the signup/invite flows.
--
-- NOTE on users.id: the spec asked for `id` to reference auth.users, but Flow 3
-- requires creating an invited users row BEFORE any Supabase Auth identity
-- exists. We therefore keep `id` as an internal PK and link Auth via the
-- nullable `auth_user_id` FK. Invited-row data (role, department, manager) is
-- preserved when the invite is accepted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop Phase-1 objects
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles cascade;
drop table if exists public.companies cascade;
drop table if exists public.departments cascade;
drop table if exists public.designations cascade;
drop table if exists public.users cascade;
drop type if exists public.user_role cascade;
drop function if exists public.current_company_id();
drop function if exists public.is_company_admin();
drop function if exists public.is_company_staff();
drop function if exists public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------
create type public.company_status as enum ('pending_verification', 'active', 'suspended');
create type public.user_role as enum ('super_admin', 'hr_admin', 'finance', 'manager', 'employee');
create type public.user_status as enum ('invited', 'active', 'suspended', 'deactivated');

-- ---------------------------------------------------------------------------
-- 3. Companies (tenants)
-- ---------------------------------------------------------------------------
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  industry      text,
  company_size  text check (company_size in ('1-10', '11-50', '51-200', '201-500', '500+')),
  timezone      text not null default 'Asia/Kolkata',
  status        public.company_status not null default 'pending_verification',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Departments & Designations (org structure, referenced by users)
-- ---------------------------------------------------------------------------
create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

create table public.designations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- ---------------------------------------------------------------------------
-- 5. Users
-- ---------------------------------------------------------------------------
create table public.users (
  id                   uuid primary key default gen_random_uuid(),
  auth_user_id         uuid unique references auth.users(id) on delete cascade,
  company_id           uuid not null references public.companies(id) on delete cascade,
  full_name            text not null,
  email                text not null,
  role                 public.user_role not null default 'employee',
  status               public.user_status not null default 'invited',
  reporting_manager_id uuid references public.users(id),
  department_id        uuid references public.departments(id) on delete set null,
  designation_id       uuid references public.designations(id) on delete set null,
  invited_by           uuid references public.users(id),
  invite_token         text unique,
  invite_expires_at    timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index users_company_id_idx on public.users (company_id);
create index users_invite_token_idx on public.users (invite_token);
create index users_auth_user_id_idx on public.users (auth_user_id);
create index users_reporting_manager_idx on public.users (reporting_manager_id);
create index departments_company_id_idx on public.departments (company_id);
create index designations_company_id_idx on public.designations (company_id);

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create trigger designations_set_updated_at
  before update on public.designations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. JWT-claim helpers (company_id + role live in the token's app_metadata)
-- ---------------------------------------------------------------------------
create or replace function public.jwt_company_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid;
$$;

create or replace function public.jwt_user_role()
returns text
language sql
stable
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- ---------------------------------------------------------------------------
-- 8. RLS: companies
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;

create policy "companies_select_own"
  on public.companies for select
  using (id = public.jwt_company_id());

create policy "companies_update_admin"
  on public.companies for update
  using (id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin', 'hr_admin'))
  with check (id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin', 'hr_admin'));

-- ---------------------------------------------------------------------------
-- 9. RLS: users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select_company"
  on public.users for select
  using (
    auth_user_id = auth.uid()
    or company_id = public.jwt_company_id()
  );

create policy "users_insert_admin"
  on public.users for insert
  with check (
    public.jwt_user_role() in ('super_admin', 'hr_admin')
    and company_id = public.jwt_company_id()
  );

create policy "users_update_own_or_admin"
  on public.users for update
  using (
    auth_user_id = auth.uid()
    or (public.jwt_user_role() in ('super_admin', 'hr_admin') and company_id = public.jwt_company_id())
  )
  with check (
    auth_user_id = auth.uid()
    or (public.jwt_user_role() in ('super_admin', 'hr_admin') and company_id = public.jwt_company_id())
  );

create policy "users_delete_admin"
  on public.users for delete
  using (
    public.jwt_user_role() in ('super_admin', 'hr_admin')
    and company_id = public.jwt_company_id()
  );

-- ---------------------------------------------------------------------------
-- 10. RLS: departments & designations
-- ---------------------------------------------------------------------------
alter table public.departments enable row level security;

create policy "departments_select_company"
  on public.departments for select
  using (company_id = public.jwt_company_id());

alter table public.designations enable row level security;

create policy "designations_select_company"
  on public.designations for select
  using (company_id = public.jwt_company_id());

-- ---------------------------------------------------------------------------
-- 11. RPCs
-- ---------------------------------------------------------------------------

-- Sanitize + dedupe a slug against existing companies.
create or replace function public.ensure_unique_slug(p_slug text)
returns text
language plpgsql
as $$
declare
  v_slug text;
  v_test text;
  v_i int := 2;
begin
  v_slug := lower(regexp_replace(coalesce(p_slug, ''), '[^a-z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'company';
  end if;
  v_test := v_slug;
  while exists (select 1 from public.companies where slug = v_slug) loop
    v_slug := v_test || '-' || v_i;
    v_i := v_i + 1;
  end loop;
  return v_slug;
end;
$$;

-- Atomic: create company + super-admin user row + seed org lists. Called by the
-- signup server action via the service-role client (RLS bypassed).
create or replace function public.signup_company(
  p_company_name text,
  p_slug text,
  p_industry text,
  p_company_size text,
  p_timezone text,
  p_auth_user_id uuid,
  p_full_name text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_slug text;
begin
  v_slug := public.ensure_unique_slug(p_slug);

  insert into public.companies (name, slug, industry, company_size, timezone, status)
  values (
    p_company_name,
    v_slug,
    nullif(p_industry, ''),
    nullif(p_company_size, ''),
    coalesce(nullif(p_timezone, ''), 'Asia/Kolkata'),
    'pending_verification'
  )
  returning id into v_company_id;

  insert into public.users (auth_user_id, company_id, full_name, email, role, status, invited_by)
  values (p_auth_user_id, v_company_id, p_full_name, p_email, 'super_admin', 'invited', null);

  insert into public.departments (company_id, name) values
    (v_company_id, 'Engineering'),
    (v_company_id, 'Human Resources'),
    (v_company_id, 'Sales'),
    (v_company_id, 'Finance'),
    (v_company_id, 'Operations');

  insert into public.designations (company_id, name) values
    (v_company_id, 'Manager'),
    (v_company_id, 'Team Lead'),
    (v_company_id, 'Developer'),
    (v_company_id, 'Analyst'),
    (v_company_id, 'Associate');

  return jsonb_build_object('company_id', v_company_id, 'slug', v_slug);
end;
$$;

-- Look up an invite token (safe projection only).
create or replace function public.get_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_full_name text;
  v_email text;
  v_status public.user_status;
  v_expires timestamptz;
begin
  select id, full_name, email, status, invite_expires_at
    into v_id, v_full_name, v_email, v_status, v_expires
  from public.users
  where invite_token = p_token;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_status <> 'invited' then
    return jsonb_build_object('valid', false, 'reason', 'already_used');
  end if;
  if v_expires is null or v_expires < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  return jsonb_build_object('valid', true, 'id', v_id, 'full_name', v_full_name, 'email', v_email);
end;
$$;

-- Atomic: link the new auth identity to the invited row and activate it.
create or replace function public.accept_invite(p_token text, p_auth_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.user_role;
begin
  update public.users
  set auth_user_id = p_auth_user_id,
      status       = 'active',
      invite_token = null,
      invite_expires_at = null,
      updated_at   = now()
  where invite_token = p_token
    and status = 'invited'
    and (invite_expires_at is null or invite_expires_at > now())
  returning company_id, role into v_company_id, v_role;

  if v_company_id is null then
    raise exception 'INVITE_INVALID';
  end if;

  return jsonb_build_object('company_id', v_company_id, 'role', v_role);
end;
$$;

-- These RPCs must only be reachable server-side (service-role). Lock them down.
revoke execute on function public.signup_company(text, text, text, text, text, uuid, text, text) from anon, authenticated;
revoke execute on function public.get_invite(text) from anon, authenticated;
revoke execute on function public.accept_invite(text, uuid) from anon, authenticated;
revoke execute on function public.ensure_unique_slug(text) from anon, authenticated;
