import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/dal";
import { LEGACY_ROLE_PERMISSIONS, type PermissionCode } from "@/lib/permissions/catalog";

export async function getEffectivePermissions(profile:Awaited<ReturnType<typeof requireProfile>>) {
  const permissions=new Set<PermissionCode>(LEGACY_ROLE_PERMISSIONS[profile.role]??[]);
  const db=createAdminClient();
  const today=new Intl.DateTimeFormat("en-CA").format(new Date());
  const {data:assignments,error}=await db.from("access_role_assignments").select("role_id").eq("company_id",profile.company_id).eq("user_id",profile.id).lte("effective_from",today).or(`effective_to.is.null,effective_to.gte.${today}`);
  if(error||!assignments?.length)return permissions;
  const {data:rows}=await db.from("access_role_permissions").select("permission_code").in("role_id",assignments.map(item=>item.role_id));
  for(const row of rows??[])permissions.add(row.permission_code as PermissionCode);
  return permissions;
}

export async function requirePermission(code:PermissionCode) {
  const profile=await requireProfile();
  const permissions=await getEffectivePermissions(profile);
  if(!permissions.has(code))throw new Error(`Permission required: ${code}`);
  return profile;
}

export async function hasPermission(code:PermissionCode) {
  const profile=await requireProfile();
  return (await getEffectivePermissions(profile)).has(code);
}
