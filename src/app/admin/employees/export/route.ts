import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

function csv(value: string | number | null) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("users")
    .select("employee_code, full_name, email, mobile_number, employment_type, employment_status, work_location, date_of_joining")
    .eq("company_id", admin.company_id).order("full_name");
  const header = ["Employee ID", "Name", "Email", "Mobile", "Employment Type", "Status", "Location", "Joining Date"];
  const rows = (data ?? []).map((employee) => [employee.employee_code, employee.full_name, employee.email, employee.mobile_number, employee.employment_type, employee.employment_status, employee.work_location, employee.date_of_joining].map(csv).join(","));
  return new Response([header.map(csv).join(","), ...rows].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
