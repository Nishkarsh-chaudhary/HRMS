import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { InviteEmployeeForm } from "../invite-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewEmployeePage() {
  const profile = await requireUserAdmin();
  const supabase = await createClient();

  const [{ data: departments }, { data: designations }, { data: managers }] =
    await Promise.all([
      supabase.from("departments").select("id, name").eq("company_id", profile.company_id).order("name"),
      supabase.from("designations").select("id, name").eq("company_id", profile.company_id).order("name"),
      supabase
        .from("users")
        .select("id, full_name")
        .eq("company_id", profile.company_id)
        .in("role", ["super_admin", "hr_admin", "finance", "manager"])
        .order("full_name"),
    ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/employees"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Invite a team member
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No self signup — they&apos;ll receive a secure link to set their own password. Invites
          expire after 7 days.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-foreground">
            Invitation details
          </CardTitle>
          <CardDescription className="text-[13px]">
            You can set department, designation and manager when they activate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteEmployeeForm
            departments={departments ?? []}
            designations={designations ?? []}
            managers={(managers ?? []).map((m) => ({ id: m.id, name: m.full_name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
