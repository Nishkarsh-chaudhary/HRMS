import { CompanyProfileForm } from "./company-profile-form";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("*").eq("id", admin.company_id).single();
  if (!company) return <div className="rounded-xl border p-6"><h1 className="text-xl font-semibold">Company profile unavailable</h1><p className="mt-2 text-sm text-muted-foreground">The company record could not be loaded.</p></div>;
  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Company settings</p><h1 className="text-3xl font-bold tracking-tight">Company Profile</h1><p className="mt-1 text-muted-foreground">Maintain a consistent company overview without changing operational configuration.</p></div>
    <CompanyProfileForm company={company} canEdit={admin.role === "super_admin" || admin.role === "hr_admin"} />
  </div>;
}
