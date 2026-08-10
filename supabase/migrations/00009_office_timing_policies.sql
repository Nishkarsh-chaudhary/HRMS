-- Complete office-timing policy support and deterministic attendance calculation.
alter table public.attendance_shifts
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists effective_from date not null default current_date,
  add column if not exists effective_to date,
  add column if not exists break_mode text not null default 'fixed' check (break_mode in ('fixed','punches')),
  add column if not exists overtime_method text not null default 'effective_hours' check (overtime_method in ('effective_hours','after_shift_end')),
  add column if not exists weekly_offs smallint[] not null default array[0,6]::smallint[],
  add column if not exists location text,
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add constraint attendance_shifts_effective_dates_check check (effective_to is null or effective_to >= effective_from);

alter table public.attendance_records
  add column if not exists gross_minutes integer not null default 0 check (gross_minutes >= 0),
  add column if not exists delay_from_start_minutes integer not null default 0 check (delay_from_start_minutes >= 0);

create table if not exists public.attendance_breaks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create unique index if not exists attendance_breaks_open_uidx on public.attendance_breaks(employee_id) where ended_at is null;
create index if not exists attendance_breaks_record_idx on public.attendance_breaks(attendance_record_id, started_at);
alter table public.attendance_breaks enable row level security;
create policy attendance_breaks_select on public.attendance_breaks for select using (
  company_id = public.jwt_company_id() and (
    employee_id = (select id from public.users where auth_user_id = auth.uid())
    or public.jwt_user_role() in ('super_admin','hr_admin','finance')
    or employee_id in (select id from public.users where reporting_manager_id = (select id from public.users where auth_user_id = auth.uid()))
  )
);
create policy attendance_breaks_admin_all on public.attendance_breaks for all using (
  company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin')
) with check (company_id = public.jwt_company_id() and public.jwt_user_role() in ('super_admin','hr_admin'));

create or replace function public.recalculate_attendance_record(p_record_id uuid)
returns public.attendance_records
language plpgsql security definer set search_path = public
as $$
declare
  v_record public.attendance_records;
  v_shift public.attendance_shifts;
  v_actor public.users;
  v_break_minutes integer := 0;
  v_gross integer := 0;
  v_effective integer := 0;
  v_scheduled_start timestamptz;
  v_scheduled_end timestamptz;
begin
  select * into v_record from public.attendance_records where id = p_record_id for update;
  if v_record.id is null then raise exception 'Attendance record not found'; end if;
  select * into v_actor from public.users where auth_user_id = auth.uid() and status = 'active';
  if v_actor.id is null or v_actor.company_id <> v_record.company_id or (v_actor.id <> v_record.employee_id and v_actor.role not in ('super_admin','hr_admin')) then
    raise exception 'Not authorized to recalculate this attendance record';
  end if;
  if v_record.locked then raise exception 'Attendance period is locked'; end if;

  select s.* into v_shift
  from public.attendance_shifts s
  where s.company_id = v_record.company_id
    and s.active
    and v_record.attendance_date between s.effective_from and coalesce(s.effective_to, 'infinity'::date)
    and (s.id = v_record.shift_id or v_record.shift_id is null)
  order by (s.id = v_record.shift_id) desc, s.effective_from desc
  limit 1;

  if v_shift.id is null then return v_record; end if;
  v_scheduled_start := (v_record.attendance_date + v_shift.start_time) at time zone v_shift.timezone;
  v_scheduled_end := ((v_record.attendance_date + case when v_shift.overnight or v_shift.end_time <= v_shift.start_time then 1 else 0 end) + v_shift.end_time) at time zone v_shift.timezone;

  if v_record.last_check_out is not null and v_record.first_check_in is not null then
    v_gross := greatest(0, floor(extract(epoch from (v_record.last_check_out - v_record.first_check_in)) / 60)::integer);
    if v_shift.break_mode = 'punches' then
      select coalesce(sum(floor(extract(epoch from (ended_at - started_at)) / 60)::integer), 0)
        into v_break_minutes from public.attendance_breaks where attendance_record_id = v_record.id and ended_at is not null;
    else
      v_break_minutes := v_shift.break_minutes;
    end if;
    v_effective := greatest(0, v_gross - v_break_minutes);
  end if;

  update public.attendance_records set
    shift_id = v_shift.id,
    scheduled_start = v_scheduled_start,
    scheduled_end = v_scheduled_end,
    gross_minutes = v_gross,
    break_minutes = v_break_minutes,
    effective_minutes = v_effective,
    delay_from_start_minutes = case when first_check_in is null then 0 else greatest(0, floor(extract(epoch from (first_check_in - v_scheduled_start)) / 60)::integer) end,
    late_minutes = case when first_check_in is null then 0 else greatest(0, floor(extract(epoch from (first_check_in - (v_scheduled_start + make_interval(mins => v_shift.grace_minutes)))) / 60)::integer) end,
    early_minutes = case when last_check_out is null then 0 else greatest(0, floor(extract(epoch from (v_scheduled_end - last_check_out)) / 60)::integer) end,
    overtime_minutes = case
      when last_check_out is null then 0
      when v_shift.overtime_method = 'after_shift_end' then greatest(0, floor(extract(epoch from (last_check_out - v_scheduled_end)) / 60)::integer)
      else greatest(0, v_effective - v_shift.full_day_minutes)
    end,
    status = case
      when first_check_in is null and last_check_out is not null then 'missing_check_in'::public.attendance_status
      when first_check_in is not null and last_check_out is null then 'missing_check_out'::public.attendance_status
      when v_effective >= v_shift.full_day_minutes then 'present'::public.attendance_status
      when v_effective >= v_shift.half_day_minutes then 'half_day'::public.attendance_status
      else 'absent'::public.attendance_status
    end
  where id = v_record.id returning * into v_record;
  return v_record;
end;
$$;

grant execute on function public.recalculate_attendance_record(uuid) to authenticated;

-- Rebuild punching so policy snapshots and calculations are applied atomically.
create or replace function public.record_attendance_punch(p_type public.punch_type, p_observed_ip inet default null, p_user_agent text default null)
returns public.attendance_records language plpgsql security definer set search_path = public
as $$
declare v_employee public.users; v_record public.attendance_records; v_shift public.attendance_shifts; v_now timestamptz := now(); v_date date; v_last public.punch_type; v_network_ok boolean;
begin
  select * into v_employee from public.users where auth_user_id=auth.uid() and status='active';
  if v_employee.id is null then raise exception 'Active employee profile not found'; end if;
  v_date := (v_now at time zone coalesce((select timezone from public.companies where id=v_employee.company_id),'UTC'))::date;
  if exists(select 1 from public.attendance_period_locks where company_id=v_employee.company_id and active and v_date between period_start and period_end) then raise exception 'Attendance period is locked'; end if;
  select exists(select 1 from public.office_networks where company_id=v_employee.company_id and active and p_observed_ip <<= cidr) into v_network_ok;
  if exists(select 1 from public.office_networks where company_id=v_employee.company_id and active) and not coalesce(v_network_ok,false) then raise exception 'Not connected to an authorized office network'; end if;
  select p.punch_type into v_last from public.attendance_punches p join public.attendance_records r on r.id=p.attendance_record_id where p.company_id=v_employee.company_id and p.employee_id=v_employee.id and r.attendance_date=v_date order by p.punched_at desc limit 1;
  if (p_type='in' and v_last='in') or (p_type='out' and v_last is distinct from 'in') then raise exception 'Invalid punch sequence'; end if;
  select s.* into v_shift from public.attendance_shift_assignments a join public.attendance_shifts s on s.id=a.shift_id where a.company_id=v_employee.company_id and a.employee_id=v_employee.id and a.effective_from<=v_date and coalesce(a.effective_to,'infinity'::date)>=v_date and s.active and s.effective_from<=v_date and coalesce(s.effective_to,'infinity'::date)>=v_date order by a.effective_from desc limit 1;
  if v_shift.id is null then select * into v_shift from public.attendance_shifts where company_id=v_employee.company_id and active and effective_from<=v_date and coalesce(effective_to,'infinity'::date)>=v_date order by effective_from desc,created_at limit 1; end if;
  insert into public.attendance_records(company_id,employee_id,shift_id,attendance_date,status,source,created_by) values(v_employee.company_id,v_employee.id,v_shift.id,v_date,'present','web',v_employee.id) on conflict(company_id,employee_id,attendance_date) do update set updated_at=now() returning * into v_record;
  insert into public.attendance_punches(company_id,attendance_record_id,employee_id,punch_type,punched_at,source,observed_ip,user_agent,created_by) values(v_employee.company_id,v_record.id,v_employee.id,p_type,v_now,'web',p_observed_ip,p_user_agent,v_employee.id);
  if p_type='in' then update public.attendance_records set first_check_in=coalesce(first_check_in,v_now),last_check_out=null,shift_id=coalesce(shift_id,v_shift.id),status='missing_check_out',source='web' where id=v_record.id;
  else update public.attendance_records set last_check_out=v_now,source='web' where id=v_record.id; end if;
  select * into v_record from public.recalculate_attendance_record(v_record.id);
  insert into public.attendance_audit_events(company_id,employee_id,actor_user_id,attendance_record_id,action,source,observed_ip,user_agent,new_value) values(v_employee.company_id,v_employee.id,v_employee.id,v_record.id,'punch_'||p_type,'web',p_observed_ip,p_user_agent,to_jsonb(v_record));
  return v_record;
end; $$;

grant execute on function public.record_attendance_punch(public.punch_type,inet,text) to authenticated;
