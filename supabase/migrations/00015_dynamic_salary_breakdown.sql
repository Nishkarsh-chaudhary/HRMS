-- Dynamic, versioned salary components and reusable structures. Existing payroll_salary_structures rows remain valid.
create type public.salary_component_type as enum ('earning','employee_deduction','employer_contribution','reimbursement','informational');
create type public.salary_calculation_method as enum ('fixed','percentage_of_ctc','percentage_of_gross','percentage_of_component','percentage_of_components','balancing','manual');
create type public.salary_workflow_status as enum ('draft','submitted','approved','scheduled','active','superseded','archived');

create table public.salary_components (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  root_id uuid, version integer not null default 1, name text not null, code text not null, display_name text,
  description text, component_type public.salary_component_type not null, calculation_method public.salary_calculation_method not null,
  fixed_amount numeric(14,2), percentage numeric(9,4), base_component_codes text[] not null default '{}',
  minimum_amount numeric(14,2), maximum_amount numeric(14,2), priority integer not null default 100,
  include_in_gross boolean not null default false, include_in_net boolean not null default false,
  include_in_ctc boolean not null default false, taxable boolean not null default false, statutory boolean not null default false,
  prorate boolean not null default true, allow_negative boolean not null default false, allow_employee_override boolean not null default false,
  show_on_salary_slip boolean not null default true, show_zero_on_salary_slip boolean not null default false,
  effective_from date not null, effective_to date, status public.salary_workflow_status not null default 'draft',
  created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(percentage is null or percentage between 0 and 1000), check(minimum_amount is null or maximum_amount is null or minimum_amount<=maximum_amount),
  check(effective_to is null or effective_to>=effective_from), unique(company_id,code,version)
);
alter table public.salary_components add constraint salary_components_root_fk foreign key(root_id) references public.salary_components(id);
create table public.salary_structure_templates (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  root_id uuid, version integer not null default 1, name text not null, code text not null, description text,
  salary_input_type text not null default 'monthly_ctc' check(salary_input_type in ('annual_ctc','monthly_ctc','monthly_gross','basic','manual')),
  component_rules jsonb not null default '[]', effective_from date not null, effective_to date,
  status public.salary_workflow_status not null default 'draft', created_by uuid references public.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,code,version)
);
alter table public.salary_structure_templates add constraint salary_templates_root_fk foreign key(root_id) references public.salary_structure_templates(id);
alter table public.payroll_salary_structures add column if not exists template_id uuid references public.salary_structure_templates(id);
alter table public.payroll_salary_structures add column if not exists monthly_ctc numeric(14,2);
alter table public.payroll_salary_structures add column if not exists monthly_gross numeric(14,2);
alter table public.payroll_salary_structures add column if not exists component_snapshot jsonb not null default '[]';
alter table public.payroll_salary_structures add column if not exists component_overrides jsonb not null default '{}';
alter table public.payroll_salary_structures add column if not exists workflow_status public.salary_workflow_status not null default 'active';
alter table public.payroll_salary_structures add column if not exists revision_reason text;
alter table public.payroll_results add column if not exists employer_contributions numeric(14,2) not null default 0;
alter table public.payroll_results add column if not exists component_results jsonb not null default '[]';

create index salary_components_company_status_idx on public.salary_components(company_id,status,component_type);
create index salary_templates_company_status_idx on public.salary_structure_templates(company_id,status);
create trigger salary_components_updated before update on public.salary_components for each row execute function public.set_updated_at();
create trigger salary_templates_updated before update on public.salary_structure_templates for each row execute function public.set_updated_at();
alter table public.salary_components enable row level security;alter table public.salary_structure_templates enable row level security;
create policy salary_components_read on public.salary_components for select using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy salary_components_write on public.salary_components for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin'));
create policy salary_templates_read on public.salary_structure_templates for select using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin','finance'));
create policy salary_templates_write on public.salary_structure_templates for all using(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin')) with check(company_id=public.jwt_company_id() and public.jwt_user_role() in('super_admin','hr_admin'));

-- Active codes are unique per company while old versions remain immutable and queryable.
create unique index salary_components_active_code_uidx on public.salary_components(company_id,code) where status in ('active','scheduled');
create unique index salary_templates_active_code_uidx on public.salary_structure_templates(company_id,code) where status in ('active','scheduled');
