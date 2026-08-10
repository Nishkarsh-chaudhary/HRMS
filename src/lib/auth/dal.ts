import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, isUserAdminRole } from "@/lib/constants";
import type { EmployeeDatabase } from "@/lib/employee-database";

export type CurrentUserRow = EmployeeDatabase["public"]["Tables"]["users"]["Row"];

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<CurrentUserRow | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data ?? null;
});

/** Requires an authenticated user; otherwise redirects to login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires an authenticated user with a company profile; otherwise redirects to login. */
export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Requires a role with admin-platform access (super_admin/hr_admin/finance). */
export async function requireAdmin() {
  const profile = await requireProfile();
  if (!isAdminRole(profile.role)) redirect("/portal");
  return profile;
}

/** Requires a user-management role (super_admin/hr_admin) for invite writes. */
export async function requireUserAdmin() {
  const profile = await requireProfile();
  if (!isUserAdminRole(profile.role)) redirect("/admin");
  return profile;
}

/** Requires the employee role (portal only). */
export async function requireEmployee() {
  const profile = await requireProfile();
  if (profile.role !== "employee") redirect("/dashboard");
  return profile;
}

/** Requires a self-service role (employee or manager) for the /portal area. */
export async function requirePortal() {
  const profile = await requireProfile();
  if (profile.role !== "employee" && profile.role !== "manager") redirect("/dashboard");
  return profile;
}
