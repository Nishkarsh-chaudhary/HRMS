-- Isolated payroll domain. Attendance and leave tables are consumed read-only.
create type public.payroll_run_status as enum ('draft','calculating','review_required','approved','locked','payment_processing','paid','published','cancelled','reopened');
create type public.payroll_run_type as enum ('regular','off_cycle','arrear','full_and_final','correction');
create type public.payroll_policy_status as enum ('draft','active','inactive','archived');

create table public.payroll_salary_structures (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete restrict, name text not null default 'Standard Salary', version integer not null default 1,
  monthly_fixed numeric(14,2) not null check(monthly_fixed>=0), earnings jsonb not null default '{}'::jsonb,
  deductions jsonb not null default '{}'::jsonb, employer_contributions jsonb not null default '{}'::jsonb,
  effective_from date not null, effective_to date, active boolean not null default true,
  created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from), unique(company_id,employee_id,version)
);
create table public.payroll_policies (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, code text not null, category text not null, description text, version integer not null default 1,
  status public.payroll_policy_status not null default 'draft', priority integer not null default 100,
  effective_from date not null, effective_to date, scope jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '[]'::jsonb, actions jsonb not null default '[]'::jsonb,
  divisor_method text not null default 'calendar_days' check(divisor_method in ('calendar_days','fixed_30','scheduled_working_days')),
  rounding_scale integer not null default 2 check(rounding_scale between 0 and 4), sandwich_enabled boolean not null default false,
  approved_by uuid references public.users(id), approved_at timestamptz, created_by uuid references public.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from), unique(company_id,code,version)
);
create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  run_number text not null, run_type public.payroll_run_type not null default 'regular', status public.payroll_run_status not null default 'draft',
  period_start date not null, period_end date not null, payment_date date not null, attendance_cutoff date not null, leave_cutoff date not null,
  payroll_group text not null default 'All Employees', input_snapshot_at timestamptz not null default now(),
  employee_count integer not null default 0, gross_total numeric(16,2) not null default 0, deduction_total numeric(16,2) not null default 0,
  net_total numeric(16,2) not null default 0, exception_count integer not null default 0,
  policy_snapshot jsonb not null default '[]'::jsonb, created_by uuid not null references public.users(id), approved_by uuid references public.users(id),
  approved_at timestamptz, locked_by uuid references public.users(id), locked_at timestamptz, paid_at timestamptz, payment_reference text,
  published_at timestamptz, reopened_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(period_end>=period_start), unique(company_id,run_number)
);
create unique index payroll_final_regular_period_uidx on public.payroll_runs(company_id,period_start,period_end) where run_type='regular' and status in ('approved','locked','payment_processing','paid','published');
create table public.payroll_results (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade, employee_id uuid not null references public.users(id) on delete restrict,
  salary_structure_id uuid references public.payroll_salary_structures(id), salary_structure_version integer,
  calendar_days numeric(6,2) not null, eligible_days numeric(6,2) not null, present_days numeric(6,2) not null default 0,
  paid_leave_days numeric(6,2) not null default 0, weekly_off_days numeric(6,2) not null default 0, holiday_days numeric(6,2) not null default 0,
  lop_days numeric(6,2) not null default 0, sandwich_lop_days numeric(6,2) not null default 0, payable_days numeric(6,2) not null default 0,
  divisor numeric(8,2) not null, fixed_earnings numeric(14,2) not null default 0, other_earnings numeric(14,2) not null default 0,
  reimbursements numeric(14,2) not null default 0, arrears numeric(14,2) not null default 0, statutory_deductions numeric(14,2) not null default 0,
  other_deductions numeric(14,2) not null default 0, recoveries numeric(14,2) not null default 0, gross_pay numeric(14,2) not null default 0,
  total_deductions numeric(14,2) not null default 0, net_pay numeric(14,2) not null default 0,
  status text not null default 'calculated', on_hold boolean not null default false, hold_reason text,
  exceptions jsonb not null default '[]'::jsonb, input_snapshot jsonb not null default '{}'::jsonb, calculation_trace jsonb not null default '[]'::jsonb,
  version integer not null default 1, calculated_at timestamptz not null default now(), unique(run_id,employee_id,version)
);
create table public.payroll_day_results (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  result_id uuid not null references public.payroll_results(id) on delete cascade, employee_id uuid not null references public.users(id) on delete restrict,
  payroll_date date not null, source_classification text not null, final_classification text not null, paid_fraction numeric(4,2) not null check(paid_fraction between 0 and 1),
  attendance_record_id uuid references public.attendance_records(id), leave_request_id uuid references public.leave_requests(id), policy_result jsonb not null default '{}'::jsonb,
  unique(result_id,payroll_date)
);
create table public.payroll_slips (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete restrict, result_id uuid not null references public.payroll_results(id) on delete restrict,
  employee_id uuid not null references public.users(id) on delete restrict, version integer not null default 1,
  status text not null default 'draft' check(status in ('draft','generated','published','superseded','failed')),
  template_version integer not null default 1, generation_id uuid not null default gen_random_uuid(), storage_path text,
  snapshot jsonb not null, published_at timestamptz, published_by uuid references public.users(id), created_at timestamptz not null default now(),
  unique(result_id,version)
);
create table public.payroll_audit_events (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid references public.payroll_runs(id) on delete cascade, result_id uuid references public.payroll_results(id) on delete set null,
  employee_id uuid references public.users(id), actor_user_id uuid references public.users(id), action text not null,
  previous_value jsonb, new_value jsonb, reason text, created_at timestamptz not null default now()
);
create index payroll_runs_company_period_idx on public.payroll_runs(company_id,period_end desc);
create index payroll_results_run_idx on public.payroll_results(run_id,status);
create index payroll_slips_employee_idx on public.payroll_slips(employee_id,published_at desc);
create trigger payroll_salary_structures_updated before update on public.payroll_salary_structures for each row execute function public.set_updated_at();
create trigger payroll_policies_updated before update on public.payroll_policies for each row execute function public.set_updated_at();
create trigger payroll_runs_updated before update on public.payroll_runs for each row execute function public.set_updated_at();

alter table public.payroll_salary_structures enable row level security; alter table public.payroll_policies enable row level security;
alter table public.payroll_runs enable row level security; alter table public.payroll_results enable row level security;
alter table public.payroll_day_results enable row level security; alter table public.payroll_slips enable row level security; alter table public.payroll_audit_events enable row level security;
create policy payroll_salary_admin on public.payroll_salary_structures for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin'));
create policy payroll_policy_read on public.payroll_policies for select using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_policy_write on public.payroll_policies for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin'));
create policy payroll_runs_admin on public.payroll_runs for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_results_admin on public.payroll_results for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_results_employee on public.payroll_results for select using(company_id=public.jwt_company_id() and employee_id=(select id from public.users where auth_user_id=auth.uid()));
create policy payroll_days_admin on public.payroll_day_results for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_days_employee on public.payroll_day_results for select using(company_id=public.jwt_company_id() and employee_id=(select id from public.users where auth_user_id=auth.uid()));
create policy payroll_slips_admin on public.payroll_slips for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_slips_employee on public.payroll_slips for select using(company_id=public.jwt_company_id() and employee_id=(select id from public.users where auth_user_id=auth.uid()) and status='published');
create policy payroll_audit_admin on public.payroll_audit_events for select using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy payroll_audit_insert on public.payroll_audit_events for insert with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
