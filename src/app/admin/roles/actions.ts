"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_PERMISSIONS, HIGH_RISK_PAIRS } from "@/lib/permissions/catalog";

export type RoleActionState={ok:boolean;message:string}|undefined;
const roleSchema=z.object({name:z.string().trim().min(2).max(80),code:z.string().trim().min(2).max(40).regex(/^[A-Za-z][A-Za-z0-9_-]*$/),description:z.string().trim().max(300).optional(),scope:z.enum(["company","department","reporting_hierarchy","selected_employees","self"]),effectiveFrom:z.string().date(),effectiveTo:z.union([z.string().date(),z.literal("")]).optional(),permissions:z.array(z.string()).min(1)});

export async function createAccessRole(_:RoleActionState,formData:FormData):Promise<RoleActionState>{
  const actor=await requireUserAdmin();
  const parsed=roleSchema.safeParse({name:formData.get("name"),code:formData.get("code"),description:formData.get("description"),scope:formData.get("scope"),effectiveFrom:formData.get("effectiveFrom"),effectiveTo:formData.get("effectiveTo"),permissions:formData.getAll("permissions")});
  if(!parsed.success)return{ok:false,message:parsed.error.issues[0]?.message??"Invalid role."};
  const permissions=parsed.data.permissions.filter((code)=>ALL_PERMISSIONS.includes(code as never));
  if(!permissions.length)return{ok:false,message:"Select at least one valid permission."};
  if(permissions.includes("payroll.run.approve")&&!permissions.includes("payroll.run.view"))return{ok:false,message:"Payroll approval requires payroll viewing."};
  if(permissions.includes("payroll.payment.mark_paid")&&!permissions.includes("payroll.payment.view"))return{ok:false,message:"Mark paid requires payment viewing."};
  if(permissions.includes("salary_slip.publish")&&!permissions.some(code=>code==="salary_slip.generate"||code==="salary_slip.view_preview"))return{ok:false,message:"Slip publication requires generation or preview access."};
  const db=createAdminClient();
  const {data:role,error}=await db.from("access_roles").insert({company_id:actor.company_id,name:parsed.data.name,code:parsed.data.code.toUpperCase(),description:parsed.data.description||null,data_scope:{type:parsed.data.scope},effective_from:parsed.data.effectiveFrom,effective_to:parsed.data.effectiveTo||null,created_by:actor.id}).select("id").single();
  if(error||!role)return{ok:false,message:error?.message??"Role could not be created."};
  const {error:permissionError}=await db.from("access_role_permissions").insert(permissions.map(permission_code=>({role_id:role.id,permission_code})));
  if(permissionError)return{ok:false,message:permissionError.message};
  const warnings=HIGH_RISK_PAIRS.filter(([a,b])=>permissions.includes(a)&&permissions.includes(b)).map(([, ,message])=>message);
  await db.from("access_audit_events").insert({company_id:actor.company_id,actor_user_id:actor.id,action:"role_created",target_type:"access_role",target_id:role.id,new_value:{name:parsed.data.name,code:parsed.data.code.toUpperCase(),permissions,scope:parsed.data.scope,warnings}});
  revalidatePath("/admin/roles");return{ok:true,message:warnings.length?`Role created. Warning: ${warnings.join("; ")}`:"Role created successfully."};
}

export async function assignAccessRole(_:RoleActionState,formData:FormData):Promise<RoleActionState>{
  const actor=await requireUserAdmin();const roleId=String(formData.get("roleId")??"");const userId=String(formData.get("userId")??"");const reason=String(formData.get("reason")??"").trim();const effectiveFrom=String(formData.get("effectiveFrom")??"");const effectiveTo=String(formData.get("effectiveTo")??"");
  if(!z.string().uuid().safeParse(roleId).success||!z.string().uuid().safeParse(userId).success||reason.length<3||!z.string().date().safeParse(effectiveFrom).success)return{ok:false,message:"Role, user, effective date, and assignment reason are required."};
  const db=createAdminClient();const [{data:role},{data:user}]=await Promise.all([db.from("access_roles").select("id,name,data_scope").eq("id",roleId).eq("company_id",actor.company_id).eq("status","active").maybeSingle(),db.from("users").select("id,full_name").eq("id",userId).eq("company_id",actor.company_id).neq("status","deactivated").maybeSingle()]);
  if(!role||!user)return{ok:false,message:"Active role or user was not found in your company."};
  const {data:assignment,error}=await db.from("access_role_assignments").insert({company_id:actor.company_id,role_id:role.id,user_id:user.id,data_scope:role.data_scope,effective_from:effectiveFrom,effective_to:effectiveTo||null,reason,assigned_by:actor.id}).select("id").single();
  if(error||!assignment)return{ok:false,message:error?.message??"Role could not be assigned."};
  await db.from("access_audit_events").insert({company_id:actor.company_id,actor_user_id:actor.id,action:"role_assigned",target_type:"access_role_assignment",target_id:assignment.id,new_value:{roleId,userId,effectiveFrom,effectiveTo:effectiveTo||null},reason});
  revalidatePath("/admin/roles");return{ok:true,message:`${role.name} assigned to ${user.full_name}.`};
}

export async function deactivateAccessRole(formData:FormData){
  const actor=await requireUserAdmin();const roleId=String(formData.get("roleId")??"");if(!z.string().uuid().safeParse(roleId).success)return;
  const db=createAdminClient();const {data:role}=await db.from("access_roles").select("*").eq("id",roleId).eq("company_id",actor.company_id).eq("system_role",false).maybeSingle();if(!role)return;
  await db.from("access_roles").update({status:"inactive"}).eq("id",role.id);
  await db.from("access_audit_events").insert({company_id:actor.company_id,actor_user_id:actor.id,action:"role_deactivated",target_type:"access_role",target_id:role.id,previous_value:{status:role.status},new_value:{status:"inactive"}});revalidatePath("/admin/roles");
}

