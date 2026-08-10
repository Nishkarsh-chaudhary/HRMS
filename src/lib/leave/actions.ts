"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/dal";
import { calculateLeaveDays } from "@/lib/leave/calculation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getLeaveCalendarMonth } from "@/lib/leave/data";
import type { LeaveCalendarMonth } from "@/lib/leave/definitions";

export type LeaveActionResult={ok:boolean;message:string};
const ApplySchema=z.object({leaveTypeId:z.string().uuid(),fromDate:z.string().date(),toDate:z.string().date(),session:z.enum(["full_day","first_half","second_half"]),reason:z.string().trim().min(3).max(1000)});

function refreshLeave(){revalidatePath("/admin/leave");revalidatePath("/employee/leave");revalidatePath("/self-service/leave")}

export async function loadLeaveCalendarMonth(month:string):Promise<LeaveCalendarMonth>{
  const profile=await requireProfile();
  if(!["super_admin","hr_admin","finance"].includes(profile.role))throw new Error("You cannot view the admin leave calendar.");
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error("Invalid calendar month.");
  return getLeaveCalendarMonth(profile,month);
}

export async function applyForLeave(input:z.infer<typeof ApplySchema>):Promise<LeaveActionResult>{
  const profile=await requireProfile();
  const parsed=ApplySchema.safeParse(input);if(!parsed.success)return{ok:false,message:parsed.error.issues[0]?.message??"Invalid leave request."};
  const db=createAdminClient();
  const [{data:type},{data:holidays},{data:overlaps}]=await Promise.all([
    db.from("leave_types").select("*").eq("id",parsed.data.leaveTypeId).eq("company_id",profile.company_id).eq("active",true).maybeSingle(),
    db.from("restricted_holidays").select("holiday_date").eq("company_id",profile.company_id).eq("active",true),
    db.from("leave_requests").select("id").eq("company_id",profile.company_id).eq("employee_id",profile.id).in("status",["submitted","pending_manager","pending_hr","approved","cancellation_pending"]).lte("from_date",parsed.data.toDate).gte("to_date",parsed.data.fromDate).limit(1),
  ]);
  if(!type)return{ok:false,message:"This leave type is not available."};
  if(overlaps?.length)return{ok:false,message:"The dates overlap an active leave request."};
  let days;try{days=calculateLeaveDays(parsed.data.fromDate,parsed.data.toDate,type.code,parsed.data.session,new Set((holidays??[]).map((row)=>row.holiday_date)))}catch(error){return{ok:false,message:error instanceof Error?error.message:"Dates could not be calculated."}}
  const quantity=days.reduce((sum,day)=>sum+day.quantity,0);if(quantity<=0)return{ok:false,message:"The selected range contains no leave days."};
  const sessionDb=await createClient();
  await sessionDb.rpc("accrue_leave_entitlements",{p_employee_id:profile.id});
  const {data:transactions}=await db.from("leave_balance_transactions").select("quantity").eq("company_id",profile.company_id).eq("employee_id",profile.id).eq("leave_type_id",type.id);
  const available=(transactions??[]).reduce((sum,row)=>sum+Number(row.quantity),0);if(available<quantity)return{ok:false,message:`Insufficient ${type.code} balance. Available: ${available}, required: ${quantity}.`};
  const status=profile.reporting_manager_id?"pending_manager":"pending_hr";
  const {data:request,error}=await db.from("leave_requests").insert({company_id:profile.company_id,employee_id:profile.id,leave_type_id:type.id,from_date:parsed.data.fromDate,to_date:parsed.data.toDate,quantity,session:parsed.data.session,reason:parsed.data.reason,status,manager_id:profile.reporting_manager_id}).select("id").single();
  if(error||!request)return{ok:false,message:error?.message??"Leave request could not be submitted."};
  const {error:dayError}=await db.from("leave_request_days").insert(days.map((day)=>({company_id:profile.company_id,request_id:request.id,leave_date:day.date,quantity:day.quantity,day_kind:day.kind})));
  const {error:ledgerError}=await db.from("leave_balance_transactions").insert({company_id:profile.company_id,employee_id:profile.id,leave_type_id:type.id,kind:"reservation",quantity:-quantity,effective_date:parsed.data.fromDate,reference_type:"leave_request",reference_id:request.id,reason:"Reserved when submitted",actor_user_id:profile.id});
  await db.from("leave_approval_actions").insert({company_id:profile.company_id,request_id:request.id,actor_user_id:profile.id,action:"submit",from_status:null,to_status:status,comment:null});
  if(dayError||ledgerError){await db.from("leave_requests").update({status:"withdrawn",reviewer_comment:"Submission failed during balance reservation"}).eq("id",request.id);return{ok:false,message:"Request could not be completed. No balance was consumed."}}
  refreshLeave();return{ok:true,message:`Leave submitted for ${quantity} day${quantity===1?"":"s"}.`};
}

export async function reviewLeaveRequest(id:string,decision:"approved"|"rejected",comment=""):Promise<LeaveActionResult>{
  const reviewer=await requireProfile();if(!["super_admin","hr_admin","manager"].includes(reviewer.role))return{ok:false,message:"You cannot review leave requests."};
  const db=createAdminClient();const {data:request}=await db.from("leave_requests").select("*").eq("id",id).eq("company_id",reviewer.company_id).maybeSingle();
  if(!request||!["submitted","pending_manager","pending_hr"].includes(request.status))return{ok:false,message:"Request is not available for review."};
  if(reviewer.id===request.employee_id)return{ok:false,message:"Self-approval is not permitted."};
  if(reviewer.role==="manager"&&request.manager_id!==reviewer.id)return{ok:false,message:"This request is not assigned to you."};
  const now=new Date().toISOString();const {error}=await db.from("leave_requests").update({status:decision,reviewer_id:reviewer.id,reviewer_comment:comment||null,reviewed_at:now,version:request.version+1}).eq("id",request.id).eq("version",request.version);
  if(error)return{ok:false,message:"The request changed while you were reviewing it. Refresh and retry."};
  await db.from("leave_balance_transactions").insert({company_id:reviewer.company_id,employee_id:request.employee_id,leave_type_id:request.leave_type_id,kind:"reservation_release",quantity:Number(request.quantity),effective_date:request.from_date,reference_type:"leave_request_release",reference_id:request.id,reason:decision==="approved"?"Reservation converted to consumption":"Reservation released after rejection",actor_user_id:reviewer.id});
  if(decision==="approved"){
    await db.from("leave_balance_transactions").insert({company_id:reviewer.company_id,employee_id:request.employee_id,leave_type_id:request.leave_type_id,kind:"consumption",quantity:-Number(request.quantity),effective_date:request.from_date,reference_type:"leave_request_consumption",reference_id:request.id,reason:"Approved leave",actor_user_id:reviewer.id});
    const {data:days}=await db.from("leave_request_days").select("leave_date,quantity").eq("request_id",request.id);
    await db.from("attendance_records").upsert((days??[]).map((day)=>({company_id:reviewer.company_id,employee_id:request.employee_id,attendance_date:day.leave_date,status:day.quantity===1?"on_leave":"half_day",source:"manual",notes:`Leave request ${request.id}`,created_by:reviewer.id})),{onConflict:"company_id,employee_id,attendance_date"});
  }
  await db.from("leave_approval_actions").insert({company_id:reviewer.company_id,request_id:request.id,actor_user_id:reviewer.id,action:decision,from_status:request.status,to_status:decision,comment:comment||null});
  refreshLeave();revalidatePath("/admin/attendance");revalidatePath("/employee/attendance");return{ok:true,message:`Leave ${decision}.`};
}

export async function withdrawLeaveRequest(id:string):Promise<LeaveActionResult>{
  const profile=await requireProfile();const db=createAdminClient();const {data:request}=await db.from("leave_requests").select("*").eq("id",id).eq("company_id",profile.company_id).eq("employee_id",profile.id).maybeSingle();
  if(!request||!["submitted","pending_manager","pending_hr"].includes(request.status))return{ok:false,message:"Only pending requests can be withdrawn."};
  await db.from("leave_requests").update({status:"withdrawn",version:request.version+1}).eq("id",request.id).eq("version",request.version);
  await db.from("leave_balance_transactions").insert({company_id:profile.company_id,employee_id:profile.id,leave_type_id:request.leave_type_id,kind:"reservation_release",quantity:Number(request.quantity),effective_date:request.from_date,reference_type:"leave_request_withdrawal",reference_id:request.id,reason:"Employee withdrawal",actor_user_id:profile.id});
  await db.from("leave_approval_actions").insert({company_id:profile.company_id,request_id:request.id,actor_user_id:profile.id,action:"withdraw",from_status:request.status,to_status:"withdrawn",comment:null});refreshLeave();return{ok:true,message:"Leave request withdrawn and balance restored."};
}
