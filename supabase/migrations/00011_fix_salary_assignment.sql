-- Assign salary structures atomically and authorize from the live user profile,
-- avoiding partial version changes and stale JWT role claims.
create or replace function public.assign_payroll_salary_structure(
  p_employee_id uuid,
  p_name text,
  p_monthly_fixed numeric,
  p_effective_from date,
  p_earnings jsonb default '{}'::jsonb,
  p_deductions jsonb default '{}'::jsonb
) returns public.payroll_salary_structures
language plpgsql security definer set search_path=public
as $$
declare
  v_actor public.users;
  v_employee public.users;
  v_previous public.payroll_salary_structures;
  v_created public.payroll_salary_structures;
  v_version integer;
begin
  select * into v_actor from public.users where auth_user_id=auth.uid() and employment_status='active';
  if v_actor.id is null or v_actor.role not in ('super_admin','hr_admin') then raise exception 'Only Super Admin or HR Admin can assign salary structures'; end if;
  select * into v_employee from public.users where id=p_employee_id and company_id=v_actor.company_id and employment_status<>'archived';
  if v_employee.id is null then raise exception 'Employee not found in your company'; end if;
  if p_monthly_fixed<0 then raise exception 'Monthly fixed salary cannot be negative'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Salary structure name is required'; end if;

  select * into v_previous from public.payroll_salary_structures
    where company_id=v_actor.company_id and employee_id=p_employee_id and active
    order by version desc limit 1 for update;
  select coalesce(max(version),0)+1 into v_version from public.payroll_salary_structures
    where company_id=v_actor.company_id and employee_id=p_employee_id;

  if v_previous.id is not null then
    update public.payroll_salary_structures set
      active=false,
      effective_to=case when effective_from<p_effective_from then p_effective_from-1 else effective_from end
    where id=v_previous.id;
  end if;

  insert into public.payroll_salary_structures(company_id,employee_id,name,version,monthly_fixed,earnings,deductions,effective_from,created_by)
  values(v_actor.company_id,p_employee_id,trim(p_name),v_version,p_monthly_fixed,coalesce(p_earnings,'{}'),coalesce(p_deductions,'{}'),p_effective_from,v_actor.id)
  returning * into v_created;

  insert into public.payroll_audit_events(company_id,employee_id,actor_user_id,action,previous_value,new_value)
  values(v_actor.company_id,p_employee_id,v_actor.id,'salary_structure_assigned',case when v_previous.id is null then null else to_jsonb(v_previous) end,to_jsonb(v_created));
  return v_created;
end; $$;
grant execute on function public.assign_payroll_salary_structure(uuid,text,numeric,date,jsonb,jsonb) to authenticated;
