-- Attendance Management: tenant-scoped shifts, punches, daily summaries,
-- regularization, office-network enforcement, period locks, and audit history.

create type public.attendance_status as enum ('present','absent','half_day','on_leave','holiday','weekly_off','work_from_home','field_work','missing_check_in','missing_check_out','not_scheduled');
create type public.attendance_source as enum ('web','mobile','manual','biometric','api','regularization');
create type public.punch_type as enum ('in','out');
create type public.regularization_status as enum ('draft','submitted','pending_manager','pending_hr','approved','rejected','cancelled','expired');

create table public.attendance_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  start_time time not null,
  end_time time not null,
  grace_minutes integer not null default 15 check (grace_minutes between 0 and 240),
  full_day_minutes integer not null default 480 check (full_day_minutes > 0),
  half_day_minutes integer not null default 240 check (half_day_minutes > 0),
  break_minutes integer not null default 30 check (break_minutes >= 0),
  overtime_after_minutes integer not null default 30 check (overtime_after_minutes >= 0),
  overnight boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.attendance_shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  shift_id uuid not null references public.attendance_shifts(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.office_networks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  location text,
  cidr cidr not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, cidr)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  shift_id uuid references public.attendance_shifts(id) on delete set null,
  attendance_date date not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  first_check_in timestamptz,
  last_check_out timestamptz,
  effective_minutes integer not null default 0 check (effective_minutes >= 0),
  break_minutes integer not null default 0 check (break_minutes >= 0),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  late_minutes integer not null default 0 check (late_minutes >= 0),
  early_minutes integer not null default 0 check (early_minutes >= 0),
  status public.attendance_status not null default 'present',
  source public.attendance_source not null default 'web',
  locked boolean not null default false,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id, attendance_date)
);

create table public.attendance_punches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  punch_type public.punch_type not null,
  punched_at timestamptz not null default now(),
  source public.attendance_source not null default 'web',
  observed_ip inet,
  user_agent text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, punched_at, punch_type)
);

create table public.attendance_regularizations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  attendance_record_id uuid references public.attendance_records(id) on delete set null,
  attendance_date date not null,
  request_type text not null,
  requested_check_in timestamptz,
  requested_check_out timestamptz,
  reason text not null,
  notes text,
  attachment_url text,
  status public.regularization_status not null default 'submitted',
  manager_id uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewer_comment text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index attendance_open_regularization_uidx on public.attendance_regularizations (company_id, employee_id, attendance_date)
  where status in ('submitted','pending_manager','pending_hr');

create table public.attendance_period_locks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  locked_by uuid not null references public.users(id) on delete restrict,
  locked_at timestamptz not null default now(),
  unlocked_by uuid references public.users(id) on delete set null,
  unlocked_at timestamptz,
  active boolean not null default true,
  check (period_end >= period_start)
);
create unique index attendance_active_period_lock_uidx on public.attendance_period_locks (company_id, period_start, period_end) where active;

create table public.attendance_audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.users(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  attendance_record_id uuid references public.attendance_records(id) on delete set null,
  action text not null,
  source public.attendance_source,
  observed_ip inet,
  user_agent text,
  result text not null default 'success',
  reason text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index attendance_records_company_date_idx on public.attendance_records (company_id, attendance_date desc);
create index attendance_records_employee_date_idx on public.attendance_records (employee_id, attendance_date desc);
create index attendance_punches_record_idx on public.attendance_punches (attendance_record_id, punched_at);
create index attendance_regularizations_review_idx on public.attendance_regularizations (company_id, status, submitted_at desc);
create index attendance_assignments_lookup_idx on public.attendance_shift_assignments (company_id, employee_id, effective_from desc);
create index attendance_audit_lookup_idx on public.attendance_audit_events (company_id, created_at desc);

create trigger attendance_shifts_set_updated_at before update on public.attendance_shifts for each row execute function public.set_updated_at();
create trigger attendance_records_set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger attendance_regularizations_set_updated_at before update on public.attendance_regularizations for each row execute function public.set_updated_at();

alter table public.attendance_shifts enable row level security;
alter table public.attendance_shift_assignments enable row level security;
alter table public.office_networks enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_punches enable row level security;
alter table public.attendance_regularizations enable row level security;
alter table public.attendance_period_locks enable row level security;
alter table public.attendance_audit_events enable row level security;

-- Tenant members can read configuration; HR admins own configuration writes.
create policy attendance_shifts_company_select on public.attendance_shifts for select using (company_id = public.jwt_company_id());
create policy attendance_shifts_admin_all on public.attendance_shifts for all using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy attendance_assignments_company_select on public.attendance_shift_assignments for select using (company_id = public.jwt_company_id());
create policy attendance_assignments_admin_all on public.attendance_shift_assignments for all using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy office_networks_admin_all on public.office_networks for all using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

-- Admins see company attendance; employees see their own; managers see reports.
create policy attendance_records_select on public.attendance_records for select using (company_id = public.jwt_company_id() and (employee_id = (select id from public.users where auth_user_id = auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin','finance') or employee_id in (select id from public.users where reporting_manager_id = (select id from public.users where auth_user_id = auth.uid()))));
create policy attendance_records_admin_write on public.attendance_records for all using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy attendance_punches_select on public.attendance_punches for select using (company_id = public.jwt_company_id() and (employee_id = (select id from public.users where auth_user_id = auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin','finance') or employee_id in (select id from public.users where reporting_manager_id = (select id from public.users where auth_user_id = auth.uid()))));

create policy regularizations_select on public.attendance_regularizations for select using (company_id = public.jwt_company_id() and (employee_id = (select id from public.users where auth_user_id = auth.uid()) or public.jwt_user_role() in ('super_admin','hr_admin') or manager_id = (select id from public.users where auth_user_id = auth.uid())));
create policy regularizations_employee_insert on public.attendance_regularizations for insert with check (company_id = public.jwt_company_id() and employee_id = (select id from public.users where auth_user_id = auth.uid()));
create policy regularizations_employee_update on public.attendance_regularizations for update using (company_id = public.jwt_company_id() and employee_id = (select id from public.users where auth_user_id = auth.uid()) and status in ('draft','submitted')) with check (company_id = public.jwt_company_id() and employee_id = (select id from public.users where auth_user_id = auth.uid()));
create policy regularizations_reviewer_update on public.attendance_regularizations for update using (company_id = public.jwt_company_id() and (public.jwt_user_role() in ('super_admin','hr_admin') or manager_id = (select id from public.users where auth_user_id = auth.uid()))) with check (company_id = public.jwt_company_id());

create policy period_locks_company_select on public.attendance_period_locks for select using (company_id = public.jwt_company_id());
create policy period_locks_admin_all on public.attendance_period_locks for all using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));
create policy attendance_audit_admin_select on public.attendance_audit_events for select using (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

-- Atomic employee punch. The observed address must be passed only by trusted server code.
create or replace function public.record_attendance_punch(p_type public.punch_type, p_observed_ip inet default null, p_user_agent text default null)
returns public.attendance_records
language plpgsql security definer set search_path = public
as $$
declare v_employee public.users; v_record public.attendance_records; v_now timestamptz := now(); v_date date; v_last public.punch_type; v_network_ok boolean;
begin
  select * into v_employee from public.users where auth_user_id = auth.uid() and status = 'active';
  if v_employee.id is null then raise exception 'Active employee profile not found'; end if;
  v_date := (v_now at time zone coalesce((select timezone from public.companies where id=v_employee.company_id),'UTC'))::date;
  if exists(select 1 from public.attendance_period_locks where company_id=v_employee.company_id and active and v_date between period_start and period_end) then raise exception 'Attendance period is locked'; end if;
  select exists(select 1 from public.office_networks where company_id=v_employee.company_id and active and p_observed_ip <<= cidr) into v_network_ok;
  if exists(select 1 from public.office_networks where company_id=v_employee.company_id and active) and not coalesce(v_network_ok,false) then
    insert into public.attendance_audit_events(company_id,employee_id,actor_user_id,action,source,observed_ip,user_agent,result,reason) values(v_employee.company_id,v_employee.id,v_employee.id,'punch_'||p_type,'web',p_observed_ip,p_user_agent,'denied','outside_authorized_network');
    raise exception 'Not connected to an authorized office network';
  end if;
  select punch_type into v_last from public.attendance_punches where employee_id=v_employee.id order by punched_at desc limit 1;
  if v_last = p_type then raise exception 'Invalid punch sequence'; end if;
  insert into public.attendance_records(company_id,employee_id,attendance_date,status,source,created_by) values(v_employee.company_id,v_employee.id,v_date,'present','web',v_employee.id)
    on conflict(company_id,employee_id,attendance_date) do update set updated_at=now() returning * into v_record;
  insert into public.attendance_punches(company_id,attendance_record_id,employee_id,punch_type,punched_at,source,observed_ip,user_agent,created_by) values(v_employee.company_id,v_record.id,v_employee.id,p_type,v_now,'web',p_observed_ip,p_user_agent,v_employee.id);
  if p_type='in' then update public.attendance_records set first_check_in=coalesce(first_check_in,v_now),last_check_out=null,status='present' where id=v_record.id;
  else update public.attendance_records set last_check_out=v_now,effective_minutes=greatest(0,(extract(epoch from (v_now-first_check_in))/60)::int-break_minutes),status='present' where id=v_record.id; end if;
  insert into public.attendance_audit_events(company_id,employee_id,actor_user_id,attendance_record_id,action,source,observed_ip,user_agent,new_value) values(v_employee.company_id,v_employee.id,v_employee.id,v_record.id,'punch_'||p_type,'web',p_observed_ip,p_user_agent,jsonb_build_object('punched_at',v_now));
  select * into v_record from public.attendance_records where id=v_record.id; return v_record;
end; $$;

grant execute on function public.record_attendance_punch(public.punch_type,inet,text) to authenticated;

-- Seed a default shift for every existing company.
insert into public.attendance_shifts(company_id,name,code,start_time,end_time) select id,'General shift','GEN','09:00','18:00' from public.companies on conflict do nothing;
