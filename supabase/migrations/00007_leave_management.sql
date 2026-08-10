-- Leave Management phase one: EL, SL and RH policies, immutable balances,
-- date-level requests, manager/HR decisions, and attendance projection.

create type public.leave_type_code as enum ('EL','SL','RH');
create type public.leave_request_status as enum ('submitted','pending_manager','pending_hr','approved','rejected','withdrawn','cancellation_pending','cancelled');
create type public.leave_transaction_kind as enum ('opening','accrual','adjustment','reservation','reservation_release','consumption','reversal','lapse','encashment');

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code public.leave_type_code not null,
  name text not null,
  annual_entitlement numeric(6,2) not null check (annual_entitlement >= 0),
  monthly_credit numeric(6,2) not null default 0 check (monthly_credit >= 0),
  colour text not null,
  requires_restricted_holiday boolean not null default false,
  sandwich_enabled boolean not null default true,
  active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.restricted_holidays (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  holiday_date date not null,
  name text not null,
  location text not null default 'All locations',
  active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, holiday_date, location)
);

create table public.leave_balance_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete restrict,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  kind public.leave_transaction_kind not null,
  quantity numeric(6,2) not null check (quantity <> 0),
  effective_date date not null,
  reference_type text not null,
  reference_id uuid,
  reason text,
  actor_user_id uuid references public.users(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create unique index leave_transactions_idempotency_idx
  on public.leave_balance_transactions(company_id, employee_id, leave_type_id, kind, reference_type, reference_id)
  where reference_id is not null;
create unique index leave_transactions_scheduled_credit_idx
  on public.leave_balance_transactions(company_id,employee_id,leave_type_id,kind,effective_date,reference_type)
  where kind='accrual';
create index leave_transactions_balance_idx on public.leave_balance_transactions(company_id,employee_id,leave_type_id,effective_date,created_at);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete restrict,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  from_date date not null,
  to_date date not null,
  quantity numeric(6,2) not null check (quantity > 0),
  session text not null default 'full_day' check (session in ('full_day','first_half','second_half')),
  reason text not null,
  status public.leave_request_status not null,
  manager_id uuid references public.users(id) on delete set null,
  reviewer_id uuid references public.users(id) on delete set null,
  reviewer_comment text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  check (to_date >= from_date)
);

create unique index leave_requests_active_overlap_guard on public.leave_requests(company_id,employee_id,from_date,to_date)
  where status in ('submitted','pending_manager','pending_hr','approved','cancellation_pending');
create index leave_requests_review_idx on public.leave_requests(company_id,status,submitted_at desc);
create index leave_requests_employee_idx on public.leave_requests(company_id,employee_id,from_date desc);
create index leave_requests_calendar_idx on public.leave_requests(company_id,from_date,to_date,status);

create table public.leave_request_days (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  request_id uuid not null references public.leave_requests(id) on delete cascade,
  leave_date date not null,
  quantity numeric(4,2) not null check (quantity > 0 and quantity <= 1),
  day_kind text not null check (day_kind in ('leave','sandwich','restricted_holiday')),
  created_at timestamptz not null default now(),
  unique (request_id, leave_date)
);

create table public.leave_approval_actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  request_id uuid not null references public.leave_requests(id) on delete restrict,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  from_status public.leave_request_status,
  to_status public.leave_request_status not null,
  comment text,
  created_at timestamptz not null default now()
);
create index leave_actions_request_idx on public.leave_approval_actions(request_id,created_at);

create or replace view public.leave_balances with (security_invoker = true) as
select t.company_id,t.employee_id,t.leave_type_id,lt.code,lt.name,
  coalesce(sum(t.quantity),0)::numeric(8,2) as available,
  coalesce(-sum(t.quantity) filter (where t.kind='reservation'),0)::numeric(8,2) as reserved,
  coalesce(-sum(t.quantity) filter (where t.kind='consumption'),0)::numeric(8,2) as consumed
from public.leave_balance_transactions t join public.leave_types lt on lt.id=t.leave_type_id
group by t.company_id,t.employee_id,t.leave_type_id,lt.code,lt.name;

create trigger leave_types_set_updated_at before update on public.leave_types for each row execute function public.set_updated_at();
create trigger leave_requests_set_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();

alter table public.leave_types enable row level security;
alter table public.restricted_holidays enable row level security;
alter table public.leave_balance_transactions enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_request_days enable row level security;
alter table public.leave_approval_actions enable row level security;

create policy leave_types_company_read on public.leave_types for select using (company_id=public.jwt_company_id());
create policy leave_types_admin_write on public.leave_types for all using (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy restricted_holidays_company_read on public.restricted_holidays for select using (company_id=public.jwt_company_id());
create policy restricted_holidays_admin_write on public.restricted_holidays for all using (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

create policy leave_transactions_read on public.leave_balance_transactions for select using
  (company_id=public.jwt_company_id() and (employee_id=(select id from public.users where auth_user_id=auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin','finance') or employee_id in (select id from public.users where reporting_manager_id=(select id from public.users where auth_user_id=auth.uid()))));
create policy leave_transactions_admin_insert on public.leave_balance_transactions for insert with check
  (company_id=public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

create policy leave_requests_read on public.leave_requests for select using
  (company_id=public.jwt_company_id() and (employee_id=(select id from public.users where auth_user_id=auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin','finance') or manager_id=(select id from public.users where auth_user_id=auth.uid())));
create policy leave_requests_employee_insert on public.leave_requests for insert with check
  (company_id=public.jwt_company_id() and employee_id=(select id from public.users where auth_user_id=auth.uid()));
create policy leave_requests_scoped_update on public.leave_requests for update using
  (company_id=public.jwt_company_id() and (employee_id=(select id from public.users where auth_user_id=auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin') or manager_id=(select id from public.users where auth_user_id=auth.uid()))) with check (company_id=public.jwt_company_id());
create policy leave_days_read on public.leave_request_days for select using
  (company_id=public.jwt_company_id() and request_id in (select id from public.leave_requests));
create policy leave_days_employee_insert on public.leave_request_days for insert with check
  (company_id=public.jwt_company_id() and request_id in (select id from public.leave_requests where employee_id=(select id from public.users where auth_user_id=auth.uid())));
create policy leave_actions_read on public.leave_approval_actions for select using
  (company_id=public.jwt_company_id() and request_id in (select id from public.leave_requests));
create policy leave_actions_actor_insert on public.leave_approval_actions for insert with check
  (company_id=public.jwt_company_id() and actor_user_id=(select id from public.users where auth_user_id=auth.uid()));

-- Seed the fixed phase-one policy for every current tenant.
insert into public.leave_types(company_id,code,name,annual_entitlement,monthly_credit,colour,requires_restricted_holiday,sandwich_enabled,effective_from)
select id,v.code::public.leave_type_code,v.name,v.entitlement,v.credit,v.colour,v.rh,v.sandwich,date_trunc('year',current_date)::date
from public.companies cross join (values
  ('EL','Earned Leave',12::numeric,1::numeric,'#6d28d9',false,true),
  ('SL','Sick Leave',6::numeric,0.5::numeric,'#0891b2',false,true),
  ('RH','Restricted Holiday',4::numeric,0::numeric,'#d97706',true,false)
) as v(code,name,entitlement,credit,colour,rh,sandwich)
on conflict(company_id,code) do nothing;

create or replace function public.seed_leave_types_for_company() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.leave_types(company_id,code,name,annual_entitlement,monthly_credit,colour,requires_restricted_holiday,sandwich_enabled,effective_from) values
    (new.id,'EL','Earned Leave',12,1,'#6d28d9',false,true,date_trunc('year',current_date)::date),
    (new.id,'SL','Sick Leave',6,0.5,'#0891b2',false,true,date_trunc('year',current_date)::date),
    (new.id,'RH','Restricted Holiday',4,0,'#d97706',true,false,date_trunc('year',current_date)::date);
  return new;
end $$;
create trigger companies_seed_leave_types after insert on public.companies for each row execute function public.seed_leave_types_for_company();

-- Idempotently materialise earned monthly credits and the separate RH grant.
-- A caller may accrue self; HR may accrue any employee in its own tenant.
create or replace function public.accrue_leave_entitlements(p_employee_id uuid default null)
returns integer language plpgsql security definer set search_path=public as $$
declare
  v_actor public.users;
  v_employee public.users;
  v_type public.leave_types;
  v_month date;
  v_first_month date;
  v_last_month date := (date_trunc('month',current_date)-interval '1 day')::date;
  v_count integer := 0;
begin
  select * into v_actor from public.users where auth_user_id=auth.uid() and status='active';
  if v_actor.id is null then raise exception 'Active profile not found'; end if;
  select * into v_employee from public.users where id=coalesce(p_employee_id,v_actor.id) and company_id=v_actor.company_id and status='active';
  if v_employee.id is null then raise exception 'Employee not found'; end if;
  if v_employee.id<>v_actor.id and v_actor.role not in ('super_admin','hr_admin') then raise exception 'Not authorised'; end if;

  for v_type in select * from public.leave_types where company_id=v_employee.company_id and active loop
    if v_type.code='RH' then
      insert into public.leave_balance_transactions(company_id,employee_id,leave_type_id,kind,quantity,effective_date,reference_type,reason,actor_user_id)
      values(v_employee.company_id,v_employee.id,v_type.id,'accrual',v_type.annual_entitlement,date_trunc('year',current_date)::date,'annual_rh','Annual restricted holiday grant',v_actor.id)
      on conflict do nothing;
      if found then v_count:=v_count+1; end if;
    else
      v_first_month := case
        when v_employee.date_of_joining is null or v_employee.date_of_joining < date_trunc('year',v_last_month)::date then date_trunc('year',v_last_month)::date
        else (date_trunc('month',v_employee.date_of_joining)+interval '2 months')::date
      end;
      v_month:=v_first_month;
      while v_month<=date_trunc('month',v_last_month)::date loop
        insert into public.leave_balance_transactions(company_id,employee_id,leave_type_id,kind,quantity,effective_date,reference_type,reason,actor_user_id)
        values(v_employee.company_id,v_employee.id,v_type.id,'accrual',v_type.monthly_credit,(v_month+interval '1 month - 1 day')::date,'monthly_credit','Completed-month leave credit',v_actor.id)
        on conflict do nothing;
        if found then v_count:=v_count+1; end if;
        v_month:=(v_month+interval '1 month')::date;
      end loop;
    end if;
  end loop;
  return v_count;
end $$;
grant execute on function public.accrue_leave_entitlements(uuid) to authenticated;
