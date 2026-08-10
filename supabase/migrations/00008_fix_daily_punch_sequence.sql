-- Punch sequences restart on each company-local attendance date. Previously the
-- most recent punch across the employee's entire history was used, so a missing
-- checkout on an earlier date could block a valid check-in today.
create or replace function public.record_attendance_punch(
  p_type public.punch_type,
  p_observed_ip inet default null,
  p_user_agent text default null
)
returns public.attendance_records
language plpgsql security definer set search_path = public
as $$
declare
  v_employee public.users;
  v_record public.attendance_records;
  v_now timestamptz := now();
  v_date date;
  v_last public.punch_type;
  v_network_ok boolean;
begin
  select * into v_employee
  from public.users
  where auth_user_id = auth.uid() and status = 'active';

  if v_employee.id is null then
    raise exception 'Active employee profile not found';
  end if;

  v_date := (
    v_now at time zone coalesce(
      (select timezone from public.companies where id = v_employee.company_id),
      'UTC'
    )
  )::date;

  if exists(
    select 1
    from public.attendance_period_locks
    where company_id = v_employee.company_id
      and active
      and v_date between period_start and period_end
  ) then
    raise exception 'Attendance period is locked';
  end if;

  select exists(
    select 1
    from public.office_networks
    where company_id = v_employee.company_id
      and active
      and p_observed_ip <<= cidr
  ) into v_network_ok;

  if exists(
    select 1
    from public.office_networks
    where company_id = v_employee.company_id and active
  ) and not coalesce(v_network_ok, false) then
    insert into public.attendance_audit_events(
      company_id, employee_id, actor_user_id, action, source,
      observed_ip, user_agent, result, reason
    ) values (
      v_employee.company_id, v_employee.id, v_employee.id,
      'punch_' || p_type, 'web', p_observed_ip, p_user_agent,
      'denied', 'outside_authorized_network'
    );
    raise exception 'Not connected to an authorized office network';
  end if;

  -- Only today's punches participate in today's in/out sequence.
  select p.punch_type into v_last
  from public.attendance_punches p
  join public.attendance_records r on r.id = p.attendance_record_id
  where p.company_id = v_employee.company_id
    and p.employee_id = v_employee.id
    and r.attendance_date = v_date
  order by p.punched_at desc
  limit 1;

  if (p_type = 'in' and v_last = 'in')
    or (p_type = 'out' and v_last is distinct from 'in') then
    raise exception 'Invalid punch sequence';
  end if;

  insert into public.attendance_records(
    company_id, employee_id, attendance_date, status, source, created_by
  ) values (
    v_employee.company_id, v_employee.id, v_date, 'present', 'web', v_employee.id
  )
  on conflict(company_id, employee_id, attendance_date)
  do update set updated_at = now()
  returning * into v_record;

  insert into public.attendance_punches(
    company_id, attendance_record_id, employee_id, punch_type, punched_at,
    source, observed_ip, user_agent, created_by
  ) values (
    v_employee.company_id, v_record.id, v_employee.id, p_type, v_now,
    'web', p_observed_ip, p_user_agent, v_employee.id
  );

  if p_type = 'in' then
    update public.attendance_records
    set first_check_in = coalesce(first_check_in, v_now),
        last_check_out = null,
        status = 'present',
        source = 'web'
    where id = v_record.id;
  else
    update public.attendance_records
    set last_check_out = v_now,
        effective_minutes = greatest(
          0,
          (extract(epoch from (v_now - first_check_in)) / 60)::int - break_minutes
        ),
        status = 'present',
        source = 'web'
    where id = v_record.id;
  end if;

  insert into public.attendance_audit_events(
    company_id, employee_id, actor_user_id, attendance_record_id,
    action, source, observed_ip, user_agent, new_value
  ) values (
    v_employee.company_id, v_employee.id, v_employee.id, v_record.id,
    'punch_' || p_type, 'web', p_observed_ip, p_user_agent,
    jsonb_build_object('punched_at', v_now)
  );

  select * into v_record
  from public.attendance_records
  where id = v_record.id;

  return v_record;
end;
$$;

