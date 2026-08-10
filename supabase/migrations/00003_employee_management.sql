-- =============================================================================
-- Employee Management — Phase 1 domain model
-- Extends the invited-user record into a complete tenant-scoped employee record.
-- =============================================================================

alter table public.users
  add column if not exists employee_code text,
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists profile_photo_url text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists marital_status text,
  add column if not exists blood_group text,
  add column if not exists personal_email text,
  add column if not exists mobile_number text,
  add column if not exists alternate_mobile_number text,
  add column if not exists date_of_joining date,
  add column if not exists employment_type text check (employment_type is null or employment_type in ('permanent','probation','contract','intern','consultant')),
  add column if not exists employment_status text not null default 'onboarding' check (employment_status in ('active','onboarding','notice_period','inactive','resigned','terminated','archived')),
  add column if not exists probation_months integer check (probation_months is null or probation_months between 0 and 36),
  add column if not exists confirmation_date date,
  add column if not exists work_mode text check (work_mode is null or work_mode in ('office','hybrid','remote','field')),
  add column if not exists work_location text,
  add column if not exists shift_name text,
  add column if not exists weekly_off_policy text,
  add column if not exists notice_period_days integer check (notice_period_days is null or notice_period_days between 0 and 365),
  add column if not exists official_mobile_number text,
  add column if not exists secondary_manager_id uuid references public.users(id) on delete set null,
  add column if not exists hr_business_partner_id uuid references public.users(id) on delete set null,
  add column if not exists team_name text,
  add column if not exists cost_centre text,
  add column if not exists grade text,
  add column if not exists employee_level text,
  add column if not exists current_address jsonb not null default '{}'::jsonb,
  add column if not exists permanent_address jsonb not null default '{}'::jsonb,
  add column if not exists emergency_contact jsonb not null default '{}'::jsonb,
  add column if not exists bank_details jsonb not null default '{}'::jsonb,
  add column if not exists statutory_details jsonb not null default '{}'::jsonb,
  add column if not exists profile_completion integer not null default 20 check (profile_completion between 0 and 100),
  add column if not exists archived_at timestamptz;

create unique index if not exists users_company_employee_code_uidx
  on public.users (company_id, lower(employee_code)) where employee_code is not null;
create unique index if not exists users_company_email_uidx
  on public.users (company_id, lower(email));
create index if not exists users_employment_status_idx
  on public.users (company_id, employment_status);
create index if not exists users_joining_date_idx
  on public.users (company_id, date_of_joining);

create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  expiry_date date,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists employee_documents_employee_idx on public.employee_documents (company_id, employee_id);
create index if not exists audit_logs_entity_idx on public.audit_logs (company_id, entity_type, entity_id, created_at desc);

alter table public.employee_documents enable row level security;
alter table public.audit_logs enable row level security;

create policy "employee_documents_admin_all" on public.employee_documents
  for all using (
    company_id = public.jwt_company_id()
    and public.jwt_user_role() in ('super_admin','hr_admin')
  ) with check (
    company_id = public.jwt_company_id()
    and public.jwt_user_role() in ('super_admin','hr_admin')
  );

create policy "employee_documents_own_select" on public.employee_documents
  for select using (
    company_id = public.jwt_company_id()
    and employee_id = (select id from public.users where auth_user_id = auth.uid())
  );

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (
    company_id = public.jwt_company_id()
    and public.jwt_user_role() in ('super_admin','hr_admin')
  );

create policy "audit_logs_admin_insert" on public.audit_logs
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_user_role() in ('super_admin','hr_admin')
  );

-- Backfill readable names and stable employee codes for existing records.
update public.users
set first_name = coalesce(first_name, split_part(full_name, ' ', 1)),
    last_name = coalesce(last_name, nullif(regexp_replace(full_name, '^\S+\s*', ''), '')),
    employee_code = coalesce(employee_code, 'EMP-' || upper(substr(replace(id::text, '-', ''), 1, 6))),
    employment_status = case when status = 'active' then 'active' else employment_status end
where first_name is null or employee_code is null;
