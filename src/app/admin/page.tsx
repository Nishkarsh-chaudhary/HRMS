import Link from "next/link";
import { Users, Clock, CalendarDays, ArrowUpRight, ShieldCheck, ShieldAlert, WalletCards } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statStyles = [
  { bg: "bg-accent text-primary", icon: Users },
  { bg: "bg-[#e8f3ff] text-[#1b84e8]", icon: Clock },
  { bg: "bg-[#e8fff3] text-[#1bb37c]", icon: CalendarDays },
  { bg: "bg-violet-50 text-violet-700", icon: WalletCards },
];

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date());
  const [{data:company},{count:employeeCount},{count:onDutyToday},{count:pendingLeave},{data:latestPayroll}]=await Promise.all([
    supabase.from("companies").select("name, slug, status").eq("id",profile.company_id).single(),
    supabase.from("users").select("id",{count:"exact",head:true}).eq("company_id",profile.company_id).in("employment_status",["active","onboarding","notice_period"]),
    supabase.from("attendance_records").select("id",{count:"exact",head:true}).eq("company_id",profile.company_id).eq("attendance_date",today).in("status",["present","work_from_home","field_work","half_day"]),
    supabase.from("leave_requests").select("id",{count:"exact",head:true}).eq("company_id",profile.company_id).in("status",["submitted","pending_manager","pending_hr","cancellation_pending"]),
    supabase.from("payroll_runs").select("id,status,period_start,period_end,net_total,employee_count").eq("company_id",profile.company_id).order("period_end",{ascending:false}).limit(1).maybeSingle(),
  ]);

  const pendingVerification = company?.status === "pending_verification";

  const stats = [
    { label: "Active employees", value: String(employeeCount ?? 0), hint: "Active, onboarding and notice period", href: "/admin/employees" },
    { label: "On duty today", value: String(onDutyToday??0), hint: `Attendance recorded on ${new Date(`${today}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}`, href: "/admin/attendance" },
    { label: "Pending leave requests", value: String(pendingLeave??0), hint: "Awaiting manager or HR review", href: "/admin/leave?tab=overview" },
    { label: "Latest net payroll", value: latestPayroll?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(latestPayroll.net_total)):"—", hint: latestPayroll?`${latestPayroll.employee_count} employees · ${latestPayroll.status.replaceAll("_"," ")}`:"No payroll run created", href: "/admin/payroll?tab=runs" },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {company?.name ?? "Dashboard"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {profile.full_name.split(" ")[0]} — here&apos;s your workspace overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingVerification && (
            <Badge
              variant="outline"
              className="gap-2 border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Awaiting verification
            </Badge>
          )}
          {!pendingVerification && (
            <Badge
              variant="outline"
              className="gap-2 border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          )}
          <Badge
            variant="outline"
            className="gap-2 border-primary/20 bg-accent px-3.5 py-2 font-mono text-sm font-semibold text-primary"
          >
            hrms.app/{company?.slug}
          </Badge>
        </div>
      </div>

      {/* Stat widgets */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = statStyles[i].icon;
          return (
            <Link key={s.label} href={s.href} className="group"><Card className="h-full border-border/80 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", statStyles[i].bg)}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-tight text-foreground">
                    {s.value}
                  </div>
                  <div className="truncate text-[13px] font-medium text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground/80">{s.hint}</div>
                </div>
              </CardContent>
            </Card></Link>
          );
        })}
      </div>

      {/* Quick actions / getting started */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-foreground">
              Getting started
            </CardTitle>
            <CardDescription className="text-[13px]">
              A few steps to get your company live on HRMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Invite your team — they'll get a secure link to set their own password",
              "Assign departments, designations and reporting managers",
              "Configure attendance & leave rules in Settings",
              "Connect biometric devices via the Biometric module",
            ].map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-3.5 rounded-lg border border-border/70 bg-background/50 px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground/90">{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-foreground">
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { label: "Invite an employee", href: "/admin/employees/new" },
              { label: "Manage employees", href: "/admin/employees" },
              { label: "Review leave", href: "/admin/leave" },
              { label: "Company settings", href: "/admin/settings" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              >
                {l.label}
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
