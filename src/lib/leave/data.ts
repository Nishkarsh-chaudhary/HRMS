import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUserRow } from "@/lib/auth/dal";
import type { AdminLeaveData, EmployeeLeaveData, LeaveBalanceView, LeaveRequestView } from "@/lib/leave/definitions";
import type { LeaveCalendarMonth } from "@/lib/leave/definitions";

const requestLabel = (value:string) => value.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());

async function requestViews(companyId:string, employeeId?:string) {
  const supabase=await createClient();
  let query=supabase.from("leave_requests").select("*").eq("company_id",companyId).order("submitted_at",{ascending:false}).limit(100);
  if(employeeId) query=query.eq("employee_id",employeeId);
  const {data:requests}=await query;
  const employeeIds=[...new Set((requests??[]).map((request)=>request.employee_id))];
  const typeIds=[...new Set((requests??[]).map((request)=>request.leave_type_id))];
  const [{data:employees},{data:types}]=await Promise.all([
    employeeIds.length?supabase.from("users").select("id,full_name,employee_code").in("id",employeeIds):Promise.resolve({data:[]}),
    typeIds.length?supabase.from("leave_types").select("id,code,name").in("id",typeIds):Promise.resolve({data:[]}),
  ]);
  const employeeMap=new Map((employees??[]).map((row)=>[row.id,row]));
  const typeMap=new Map((types??[]).map((row)=>[row.id,row]));
  return (requests??[]).map((request):LeaveRequestView=>({id:request.id,employeeName:employeeMap.get(request.employee_id)?.full_name??"Employee",employeeCode:employeeMap.get(request.employee_id)?.employee_code??"—",leaveCode:(typeMap.get(request.leave_type_id)?.code??"EL") as "EL"|"SL"|"RH",leaveName:typeMap.get(request.leave_type_id)?.name??"Leave",fromDate:request.from_date,toDate:request.to_date,quantity:Number(request.quantity),reason:request.reason,status:requestLabel(request.status),submittedAt:request.submitted_at,reviewerComment:request.reviewer_comment}));
}

async function balances(profile:CurrentUserRow, employeeId=profile.id):Promise<LeaveBalanceView[]> {
  const supabase=await createClient();
  await supabase.rpc("accrue_leave_entitlements",{p_employee_id:employeeId});
  const [{data:types},{data:transactions}]=await Promise.all([
    supabase.from("leave_types").select("*").eq("company_id",profile.company_id).eq("active",true).order("code"),
    supabase.from("leave_balance_transactions").select("leave_type_id,kind,quantity").eq("company_id",profile.company_id).eq("employee_id",employeeId),
  ]);
  return (types??[]).map((type)=>{const rows=(transactions??[]).filter((row)=>row.leave_type_id===type.id);return{id:type.id,code:type.code,name:type.name,colour:type.colour,annualEntitlement:Number(type.annual_entitlement),available:rows.reduce((sum,row)=>sum+Number(row.quantity),0),reserved:-rows.filter((row)=>row.kind==="reservation").reduce((sum,row)=>sum+Number(row.quantity),0),consumed:-rows.filter((row)=>row.kind==="consumption").reduce((sum,row)=>sum+Number(row.quantity),0)}});
}

export async function getEmployeeLeaveData(profile:CurrentUserRow):Promise<EmployeeLeaveData>{
  const supabase=await createClient();
  const year=new Date().getFullYear();
  const [{data:holidays},employeeBalances,requests]=await Promise.all([supabase.from("restricted_holidays").select("holiday_date,name,location").eq("company_id",profile.company_id).eq("active",true).gte("holiday_date",`${year}-01-01`).lte("holiday_date",`${year}-12-31`).order("holiday_date"),balances(profile),requestViews(profile.company_id,profile.id)]);
  return{employeeName:profile.full_name,balances:employeeBalances,requests,restrictedHolidays:(holidays??[]).map((holiday)=>({date:holiday.holiday_date,name:holiday.name,location:holiday.location}))};
}

export async function getAdminLeaveData(profile:CurrentUserRow):Promise<AdminLeaveData>{
  const supabase=await createClient();
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date());
  const [requests,{count:employeeCount},{data:types},initialCalendar]=await Promise.all([requestViews(profile.company_id),supabase.from("users").select("id",{count:"exact",head:true}).eq("company_id",profile.company_id).eq("employment_status","active"),supabase.from("leave_types").select("*").eq("company_id",profile.company_id).eq("active",true).order("code"),getLeaveCalendarMonth(profile,today.slice(0,7))]);
  return{kpis:{onLeaveToday:requests.filter((row)=>row.status==="Approved"&&row.fromDate<=today&&row.toDate>=today).length,pending:requests.filter((row)=>row.status.startsWith("Pending")||row.status==="Submitted").length,upcoming:requests.filter((row)=>row.status==="Approved"&&row.fromDate>today).length,unpaid:0},requests,employeeCount:employeeCount??0,canReview:["super_admin","hr_admin"].includes(profile.role),initialCalendar,leaveTypes:(types??[]).map((type)=>({id:type.id,code:type.code,name:type.name,colour:type.colour,annualEntitlement:Number(type.annual_entitlement),available:0,reserved:0,consumed:0}))};
}

export async function getLeaveCalendarMonth(profile:CurrentUserRow,month:string):Promise<LeaveCalendarMonth>{
  const supabase=await createClient();
  const start=`${month}-01`;const end=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).toISOString().slice(0,10);
  const [{data:requests},{data:employees},{data:departments},{data:designations},{data:holidays},{count:employeeCount}]=await Promise.all([
    supabase.from("leave_requests").select("*").eq("company_id",profile.company_id).lte("from_date",end).gte("to_date",start).in("status",["submitted","pending_manager","pending_hr","approved","rejected"]).order("from_date"),
    supabase.from("users").select("id,full_name,employee_code,department_id,designation_id,team_name,work_location,reporting_manager_id").eq("company_id",profile.company_id).neq("employment_status","archived"),
    supabase.from("departments").select("id,name").eq("company_id",profile.company_id),
    supabase.from("designations").select("id,name").eq("company_id",profile.company_id),
    supabase.from("restricted_holidays").select("holiday_date,name").eq("company_id",profile.company_id).eq("active",true).gte("holiday_date",start).lte("holiday_date",end),
    supabase.from("users").select("id",{count:"exact",head:true}).eq("company_id",profile.company_id).eq("employment_status","active"),
  ]);
  const ids=(requests??[]).map((request)=>request.id);const reviewerIds=[...new Set((requests??[]).map((request)=>request.reviewer_id).filter(Boolean))] as string[];
  const [{data:days},{data:types},{data:reviewers}]=await Promise.all([
    ids.length?supabase.from("leave_request_days").select("request_id,leave_date").in("request_id",ids).gte("leave_date",start).lte("leave_date",end):Promise.resolve({data:[]}),
    supabase.from("leave_types").select("id,code,name").eq("company_id",profile.company_id),
    reviewerIds.length?supabase.from("users").select("id,full_name").in("id",reviewerIds):Promise.resolve({data:[]}),
  ]);
  const employeeMap=new Map((employees??[]).map((row)=>[row.id,row]));const departmentMap=new Map((departments??[]).map((row)=>[row.id,row.name]));const designationMap=new Map((designations??[]).map((row)=>[row.id,row.name]));const typeMap=new Map((types??[]).map((row)=>[row.id,row]));const reviewerMap=new Map((reviewers??[]).map((row)=>[row.id,row.full_name]));
  return{month,employeeCount:employeeCount??0,holidays:(holidays??[]).map((row)=>({date:row.holiday_date,name:row.name})),departments:[...new Set((departments??[]).map((row)=>row.name))].sort(),locations:[...new Set((employees??[]).map((row)=>row.work_location).filter(Boolean))] as string[],events:(requests??[]).map((request)=>{const employee=employeeMap.get(request.employee_id);const type=typeMap.get(request.leave_type_id);return{id:request.id,employeeId:request.employee_id,employeeName:employee?.full_name??"Employee",employeeCode:employee?.employee_code??"—",department:employee?.department_id?departmentMap.get(employee.department_id)??"Unassigned":"Unassigned",designation:employee?.designation_id?designationMap.get(employee.designation_id)??"Unassigned":"Unassigned",team:employee?.team_name??"Unassigned",manager:employee?.reporting_manager_id?employeeMap.get(employee.reporting_manager_id)?.full_name??"Unassigned":"Unassigned",location:employee?.work_location??"Unassigned",leaveCode:(type?.code??"EL") as "EL"|"SL"|"RH",leaveName:type?.name??"Leave",fromDate:request.from_date,toDate:request.to_date,session:request.session,quantity:Number(request.quantity),reason:request.reason,status:requestLabel(request.status),requestedAt:request.submitted_at,approvedBy:request.reviewer_id?reviewerMap.get(request.reviewer_id)??"—":"—",dates:(days??[]).filter((day)=>day.request_id===request.id).map((day)=>day.leave_date)}})};
}
