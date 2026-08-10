import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/dal";
import { isAdminRole } from "@/lib/constants";

export default async function DashboardPage() {
  const profile = await requireProfile();
  redirect(isAdminRole(profile.role) ? "/admin" : "/portal");
}
