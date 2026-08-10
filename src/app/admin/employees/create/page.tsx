import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmployeeOnboardingForm } from "./employee-onboarding-form";

export default async function CreateEmployeePage() {
  const profile = await requireUserAdmin();
  const supabase = await createClient();
  const [{ data: departments }, { data: designations }, { data: managers }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("company_id", profile.company_id).order("name"),
    supabase.from("designations").select("id, name").eq("company_id", profile.company_id).order("name"),
    supabase.from("users").select("id, full_name").eq("company_id", profile.company_id).in("role", ["super_admin", "hr_admin", "manager"]).order("full_name"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/employees" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Back to employees</Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Employee</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create the employee record, organisational mapping, and login access.</p>
      </div>
      <EmployeeOnboardingForm
        departments={departments ?? []}
        designations={designations ?? []}
        managers={(managers ?? []).map((manager) => ({ id: manager.id, name: manager.full_name }))}
      />
    </div>
  );
}
