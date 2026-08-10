"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheck2, CalendarClock, CalendarDays, Check, Clock3, LayoutDashboard, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { reviewLeaveRequest } from "@/lib/leave/actions";
import type { AdminLeaveData } from "@/lib/leave/definitions";
import { AdminLeaveCalendar } from "@/components/leave/admin-leave-calendar";

const pretty = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function AdminLeaveWorkspace({ kpis, requests, leaveTypes, employeeCount, canReview, initialCalendar, activeTab }: AdminLeaveData & { activeTab: "overview" | "calendar" }) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = requests.filter((row) => `${row.employeeName} ${row.employeeCode} ${row.leaveCode} ${row.status}`.toLowerCase().includes(query.toLowerCase()));
  const review = (id: string, decision: "approved" | "rejected") => startTransition(async () => {
    const result = await reviewLeaveRequest(id, decision);
    if (result.ok) toast.success(result.message); else toast.error(result.message);
  });

  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Workforce management</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Leave management</h2><p className="mt-1 text-sm text-muted-foreground">Policy-controlled balances, requests, approvals, and attendance handoff.</p></div>
    <nav className="relative z-10 inline-flex w-fit rounded-lg border bg-muted/40 p-1" aria-label="Leave management views">
      <Link href="/admin/leave?tab=overview" aria-current={activeTab === "overview" ? "page" : undefined} className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "overview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><LayoutDashboard className="size-4"/>Overview & Requests</Link>
      <Link href="/admin/leave?tab=calendar" aria-current={activeTab === "calendar" ? "page" : undefined} className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><CalendarDays className="size-4"/>Calendar</Link>
    </nav>
    {activeTab === "calendar" ? <AdminLeaveCalendar initial={initialCalendar} canReview={canReview}/> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["On leave today", kpis.onLeaveToday, CalendarCheck2, "text-emerald-600 bg-emerald-50"], ["Pending approval", kpis.pending, Clock3, "text-amber-600 bg-amber-50"], ["Upcoming leave", kpis.upcoming, CalendarClock, "text-primary bg-accent"], ["Active employees", employeeCount, Users, "text-sky-600 bg-sky-50"]].map(([label, value, Icon, tone]) => { const C = Icon as typeof Users; return <Card key={String(label)}><CardContent className="flex items-center gap-4 p-5"><span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}><C /></span><div><p className="text-2xl font-semibold">{String(value)}</p><p className="text-sm text-muted-foreground">{String(label)}</p></div></CardContent></Card>; })}</div>
      <div className="grid gap-4 md:grid-cols-3">{leaveTypes.map((type) => <Card key={type.id}><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-xl font-bold text-white" style={{ background: type.colour }}>{type.code}</span><div><p className="font-semibold">{type.name}</p><p className="text-sm text-muted-foreground">{type.annualEntitlement} days/year</p></div></CardContent></Card>)}</div>
      <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Leave requests</CardTitle><CardDescription>Manager and HR approval queue with staffing dates and balance deductions</CardDescription></div><Input className="w-full sm:w-72" placeholder="Search employee, type, or status" value={query} onChange={(event) => setQuery(event.target.value)} /></div></CardHeader><CardContent className="space-y-3">{filtered.map((request) => { const actionable = canReview && (request.status.startsWith("Pending") || request.status === "Submitted"); return <div key={request.id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center"><div><p className="font-medium">{request.employeeName} <span className="text-xs text-muted-foreground">{request.employeeCode}</span></p><p className="mt-1 text-sm text-muted-foreground">{request.leaveCode} · {request.quantity} day{request.quantity === 1 ? "" : "s"} · submitted {new Date(request.submittedAt).toLocaleDateString("en-IN")}</p></div><div><p className="text-sm font-medium">{pretty(request.fromDate)}{request.fromDate !== request.toDate ? ` – ${pretty(request.toDate)}` : ""}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{request.reason}</p></div><div className="flex items-center gap-2"><LeaveStatusBadge status={request.status} />{actionable && <><Button size="sm" variant="outline" disabled={pending} onClick={() => review(request.id, "rejected")} aria-label="Reject"><X /></Button><Button size="sm" disabled={pending} onClick={() => review(request.id, "approved")}><Check />Approve</Button></>}</div></div>; })}{filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No leave requests match this view.</p>}</CardContent></Card>
    </>}
  </div>;
}
