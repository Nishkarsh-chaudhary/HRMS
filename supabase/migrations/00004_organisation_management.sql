-- Organisation Management: tenant-scoped hierarchy, designations and employee mapping.
create type public.organisation_node_type as enum ('company','business_unit','location','department','sub_department','team');

create table public.organisation_nodes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  parent_id uuid references public.organisation_nodes(id) on delete restrict,
  node_type public.organisation_node_type not null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  code text not null check (code ~ '^[A-Z0-9_-]{2,20}$'),
  description text,
  head_user_id uuid references public.users(id) on delete set null,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  check (id <> parent_id)
);

alter table public.designations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists code text,
  add column if not exists level integer not null default 1 check (level between 1 and 20),
  add column if not exists parent_id uuid references public.designations(id) on delete set null,
  add column if not exists description text,
  add column if not exists status text not null default 'active' check (status in ('active','archived'));

alter table public.departments
  add column if not exists updated_at timestamptz not null default now();

alter table public.users
  add column if not exists organisation_node_id uuid references public.organisation_nodes(id) on delete set null;

create unique index designations_company_code_uidx on public.designations (company_id, upper(code)) where code is not null;
create index organisation_nodes_company_parent_idx on public.organisation_nodes (company_id, parent_id, sort_order);
create index users_organisation_node_idx on public.users (company_id, organisation_node_id);

create trigger organisation_nodes_set_updated_at before update on public.organisation_nodes
  for each row execute function public.set_updated_at();

create or replace function public.prevent_organisation_cycle()
returns trigger language plpgsql as $$
begin
  if new.parent_id is null then return new; end if;
  if exists (
    with recursive descendants as (
      select id from public.organisation_nodes where parent_id = new.id
      union all select n.id from public.organisation_nodes n join descendants d on n.parent_id = d.id
    ) select 1 from descendants where id = new.parent_id
  ) then raise exception 'Circular organisation hierarchy is not allowed'; end if;
  return new;
end; $$;

create trigger organisation_nodes_prevent_cycle before insert or update of parent_id on public.organisation_nodes
  for each row execute function public.prevent_organisation_cycle();

alter table public.organisation_nodes enable row level security;
create policy "organisation_nodes_company_select" on public.organisation_nodes for select
  using (company_id = public.jwt_company_id());
create policy "organisation_nodes_admin_insert" on public.organisation_nodes for insert
  with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy "organisation_nodes_admin_update" on public.organisation_nodes for update
  using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'))
  with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy "organisation_nodes_admin_delete" on public.organisation_nodes for delete
  using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

create policy "departments_admin_all" on public.departments for all
  using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'))
  with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy "designations_admin_all" on public.designations for all
  using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'))
  with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
