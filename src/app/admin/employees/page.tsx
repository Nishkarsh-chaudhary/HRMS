import Link from "next/link";
import { CalendarPlus, CheckCircle2, Download, Search, UserCheck, UserMinus, UserPlus, Users, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  onboarding: "border-blue-200 bg-blue-50 text-blue-700",
  notice_period: "border-amber-200 bg-amber-50 text-amber-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  resigned: "border-violet-200 bg-violet-50 text-violet-700",
  terminated: "border-red-200 bg-red-50 text-red-700",
  archived: "border-slate-300 bg-slate-100 text-slate-500",
};

function label(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "—";
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const department = typeof params.department === "string" ? params.department : "";
  const created = params.created === "1";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 10;
  const supabase = await createClient();

  const [{ data: allEmployees }, { data: departments }, { data: designations }] = await Promise.all([
    supabase.from("users").select("id, employment_status, date_of_joining, profile_completion").eq("company_id", profile.company_id),
    supabase.from("departments").select("id, name").eq("company_id", profile.company_id).order("name"),
    supabase.from("designations").select("id, name").eq("company_id", profile.company_id).order("name"),
  ]);

  let employeeQuery = supabase.from("users").select(
    "id, full_name, email, employee_code, mobile_number, department_id, designation_id, reporting_manager_id, work_location, employment_type, date_of_joining, profile_completion, employment_status, created_at",
    { count: "exact" }
  ).eq("company_id", profile.company_id).order("created_at", { ascending: false });
  if (!status) employeeQuery = employeeQuery.neq("employment_status", "archived");
  if (status) employeeQuery = employeeQuery.eq("employment_status", status);
  if (department) employeeQuery = employeeQuery.eq("department_id", department);
  if (q) employeeQuery = employeeQuery.or(`full_name.ilike.%${q.replaceAll(",", "")}%,email.ilike.%${q.replaceAll(",", "")}%,employee_code.ilike.%${q.replaceAll(",", "")}%,mobile_number.ilike.%${q.replaceAll(",", "")}%`);
  const { data: employees, count, error } = await employeeQuery.range((page - 1) * pageSize, page * pageSize - 1);

  const managerIds = [...new Set((employees ?? []).map((employee) => employee.reporting_manager_id).filter(Boolean))] as string[];
  const { data: managers } = managerIds.length
    ? await supabase.from("users").select("id, full_name").in("id", managerIds)
    : { data: [] };
  const departmentMap = new Map((departments ?? []).map((item) => [item.id, item.name]));
  const designationMap = new Map((designations ?? []).map((item) => [item.id, item.name]));
  const managerMap = new Map((managers ?? []).map((item) => [item.id, item.full_name]));
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const workforce = allEmployees ?? [];
  const kpis = [
    { label: "Total Employees", value: workforce.length, detail: "All employee records", icon: Users, href: "/admin/employees", tone: "bg-blue-50 text-blue-600" },
    { label: "Active Employees", value: workforce.filter((item) => item.employment_status === "active").length, detail: workforce.length ? `${Math.round(workforce.filter((item) => item.employment_status === "active").length / workforce.length * 100)}% of workforce` : "0% of workforce", icon: UserCheck, href: "/admin/employees?status=active", tone: "bg-emerald-50 text-emerald-600" },
    { label: "New Joiners", value: workforce.filter((item) => item.date_of_joining?.startsWith(thisMonth)).length, detail: "Joined this month", icon: CalendarPlus, href: "/admin/employees", tone: "bg-violet-50 text-violet-600" },
    { label: "Onboarding", value: workforce.filter((item) => item.employment_status === "onboarding" || item.profile_completion < 100).length, detail: "Profiles in progress", icon: UserPlus, href: "/admin/employees?status=onboarding", tone: "bg-amber-50 text-amber-600" },
    { label: "Inactive", value: workforce.filter((item) => ["inactive", "resigned", "terminated", "archived"].includes(item.employment_status)).length, detail: "Inactive or archived", icon: UserMinus, href: "/admin/employees?status=inactive", tone: "bg-rose-50 text-rose-600" },
  ];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div className="space-y-6">
      {created && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 />
          <AlertDescription>Employee created successfully.</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Employees</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage employee records, onboarding, organisational assignments, and status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" disabled title="CSV import is the next delivery"><Upload className="h-4 w-4" />Import</Button>
          <Button nativeButton={false} render={<Link href="/admin/employees/export" />} variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
          <Button nativeButton={false} render={<Link href="/admin/employees/create" />} className="gap-2 shadow-md shadow-primary/20"><UserPlus className="h-4 w-4" />Add Employee</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <Link href={item.href} key={item.label}>
            <Card className="h-full border-border/80 bg-white shadow-none transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span>
                  <span className="text-2xl font-bold text-foreground">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/80 bg-white shadow-none">
        <CardContent className="p-0">
          <form className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="Search name, ID, email or mobile…" className="h-10 bg-muted/30 pl-9" />
            </div>
            <select name="department" defaultValue={department} className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-foreground">
              <option value="">All departments</option>{(departments ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="status" defaultValue={status} className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-foreground">
              <option value="">Active workforce</option>{["active", "onboarding", "notice_period", "inactive", "resigned", "terminated", "archived"].map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <Button type="submit" variant="outline">Apply Filters</Button>
            {(q || status || department) && <Button nativeButton={false} render={<Link href="/admin/employees" />} variant="ghost">Clear all</Button>}
          </form>

          {error ? (
            <div className="p-12 text-center"><p className="font-semibold text-destructive">Employee records could not be loaded.</p><p className="mt-1 text-sm text-muted-foreground">Confirm the employee database migration has been applied.</p></div>
          ) : !employees?.length ? (
            <div className="p-14 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/40" /><h3 className="mt-4 font-semibold text-foreground">{q || status || department ? "No matching employees found" : "No employees added yet"}</h3><p className="mt-1 text-sm text-muted-foreground">{q || status || department ? "Try changing or clearing the selected filters." : "Start building your organisation by adding the first employee."}</p><Button nativeButton={false} render={<Link href={q || status || department ? "/admin/employees" : "/admin/employees/create"} />} className="mt-5">{q || status || department ? "Clear Filters" : "Add First Employee"}</Button></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="sticky top-0 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Employee", "Employee ID", "Department", "Designation", "Manager", "Location", "Type", "Joining Date", "Completion", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((employee) => {
                      const initials = employee.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
                      return <tr key={employee.id} className="transition hover:bg-muted/20">
                        <td className="px-4 py-4"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback></Avatar><div><Link href={`/admin/employees/${employee.id}`} className="font-semibold text-foreground hover:text-primary">{employee.full_name}</Link><p className="text-xs text-muted-foreground">{employee.email}</p></div></div></td>
                        <td className="px-4 py-4 font-mono text-xs text-foreground">{employee.employee_code ?? "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{employee.department_id ? departmentMap.get(employee.department_id) ?? "—" : "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{employee.designation_id ? designationMap.get(employee.designation_id) ?? "—" : "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{employee.reporting_manager_id ? managerMap.get(employee.reporting_manager_id) ?? "—" : "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{employee.work_location ?? "—"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{label(employee.employment_type)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-4 py-4"><div className="w-24"><div className="mb-1 flex justify-between text-[11px]"><span>{employee.profile_completion}%</span></div><Progress value={employee.profile_completion} /></div></td>
                        <td className="px-4 py-4"><Badge variant="outline" className={statusStyles[employee.employment_status]}>{label(employee.employment_status)}</Badge></td>
                        <td className="px-4 py-4 text-right"><div className="flex justify-end gap-1"><Button nativeButton={false} render={<Link href={`/admin/employees/${employee.id}`} />} variant="ghost" size="sm">View</Button><Button nativeButton={false} render={<Link href={`/admin/employees/${employee.id}/edit`} />} variant="ghost" size="sm">Edit</Button></div></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border lg:hidden">{employees.map((employee) => <Link href={`/admin/employees/${employee.id}`} key={employee.id} className="block p-4 hover:bg-muted/20"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{employee.full_name}</p><p className="text-xs text-muted-foreground">{employee.employee_code} · {employee.email}</p></div><Badge variant="outline" className={statusStyles[employee.employment_status]}>{label(employee.employment_status)}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>{employee.department_id ? departmentMap.get(employee.department_id) : "No department"}</span><span>{employee.work_location ?? "No location"}</span></div></Link>)}</div>
            </>
          )}

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground"><span>{count ?? 0} employee{count === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><Button nativeButton={false} render={<Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(department ? { department } : {}), page: String(Math.max(1, page - 1)) })}`} />} variant="outline" size="sm" disabled={page <= 1}>Previous</Button><span>Page {page} of {totalPages}</span><Button nativeButton={false} render={<Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(department ? { department } : {}), page: String(Math.min(totalPages, page + 1)) })}`} />} variant="outline" size="sm" disabled={page >= totalPages}>Next</Button></div></div>
        </CardContent>
      </Card>
    </div>
  );
}
