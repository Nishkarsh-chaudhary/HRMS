-- =============================================================================
-- HRMS Platform — Initial Schema
-- Companies, Profiles (with roles), RLS, and signup triggers.
-- Run this in Supabase Dashboard > SQL Editor (or via `supabase db push`).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('owner', 'admin', 'hr', 'manager', 'employee');

-- -----------------------------------------------------------------------------
-- Companies
-- -----------------------------------------------------------------------------
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  company_code  text not null unique,
  created_by    uuid references auth.users(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.companies.company_code is
  'Short join code employees use to request access to this company.';

-- -----------------------------------------------------------------------------
-- Profiles (one row per auth.users row)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  full_name   text not null,
  email       text not null,
  role        public.user_role not null default 'employee',
  status      text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_company_id_idx on public.profiles (company_id);
create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (email);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
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

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create a profile whenever a new auth user is created.
-- Role / company are taken from user metadata, which only our server sets.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role       public.user_role;
begin
  v_company_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_id', '')), '')::uuid;
  v_role       := coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), ''), 'employee')::public.user_role;

  insert into public.profiles (id, company_id, full_name, email, role)
  values (
    new.id,
    v_company_id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS helper functions
-- -----------------------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (select role in ('owner', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_company_staff()
returns boolean
language sql
stable
as $$
  select coalesce(
    (select role in ('owner', 'admin', 'hr', 'manager') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS: companies
-- -----------------------------------------------------------------------------
alter table public.companies enable row level security;

create policy "companies_select_own"
  on public.companies for select
  using (id = public.current_company_id());

create policy "companies_insert_first_only"
  on public.companies for insert
  with check (
    auth.role() = 'authenticated'
    and not exists (
      select 1 from public.companies c where c.created_by = auth.uid()
    )
  );

create policy "companies_update_admin"
  on public.companies for update
  using (public.is_company_admin())
  with check (public.is_company_admin());

create policy "companies_delete_admin"
  on public.companies for delete
  using (public.is_company_admin());

-- -----------------------------------------------------------------------------
-- RLS: profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (
    id = auth.uid()
    or (company_id = public.current_company_id() and public.is_company_staff())
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
    and company_id is not null
  )
  with check (
    company_id = public.current_company_id()
    and public.is_company_admin()
  );

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
  );

-- -----------------------------------------------------------------------------
-- Seed: nothing required. First signup creates the first company.
-- -----------------------------------------------------------------------------
