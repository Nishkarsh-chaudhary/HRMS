"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2,
  Clock3, Download, FileClock, Filter, MoreHorizontal,
  Search, UserMinus, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AttendanceStatusBadge } from "@/components/attendance/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { reviewRegularization, toggleAttendanceMonthLock } from "@/lib/attendance/actions";
import { OfficePolicyManager, type OfficePolicyView } from "@/components/attendance/office-policy-manager";
import { MonthlyAttendance, type AttendanceMatrixRow } from "@/components/attendance/monthly-attendance";
export type { AttendanceMatrixRow } from "@/components/attendance/monthly-attendance";

export type AttendanceListRow = { name: string; id: string; dept: string; shift: string; in: string; out: string; hours: string; status: string; late: string; avatar: string };
export type AttendanceRequestRow = { id: string; name: string; date: string; type: string; requested: string; submitted: string; status: string };
export type AttendanceShiftView = OfficePolicyView;
export type AttendanceKpis = { total: number; present: number; absent: number; leave: number; late: number; remote: number; missingCheckout: number; pendingRequests: number };
// Used only to preserve the compact component signature's inferred array shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requests: AttendanceRequestRow[] = [];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function HeaderActions({ onAdd, onExport }: { onAdd: () => void; onExport: () => void }) {
  return <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onExport}><Download /> Export</Button><Button onClick={onAdd}><FileClock /> Add attendance</Button></div>;
}

export function AdminAttendanceWorkspace({ initialRecords = [], initialTab = "overview", matrixRows = [], requestRows = [], shiftRows = [], departments = [], companyTimezone = "Asia/Kolkata", selectedMonth, today, initialLocked = false, attendanceKpis }: { initialRecords?: AttendanceListRow[]; initialTab?: string; matrixRows?: AttendanceMatrixRow[]; requestRows?: AttendanceRequestRow[]; shiftRows?: AttendanceShiftView[]; departments?: { id: string; name: string }[]; companyTimezone?: string; selectedMonth: string; today: string; initialLocked?: boolean; attendanceKpis: AttendanceKpis }) {
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [records] = useState(initialRecords);
  const [requestItems, setRequestItems] = useState(requestRows);
  const [locked, setLocked] = useState(initialLocked);
  const kpis = [
    { label: "Present today", value: String(attendanceKpis.present), sub: `${attendanceKpis.total ? Math.round(attendanceKpis.present / attendanceKpis.total * 100) : 0}% of workforce`, trend: "Current", up: true, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Absent", value: String(attendanceKpis.absent), sub: `${attendanceKpis.total ? Math.round(attendanceKpis.absent / attendanceKpis.total * 100) : 0}% of workforce`, trend: "Current", up: false, icon: UserMinus, color: "bg-rose-50 text-rose-600" },
    { label: "On leave", value: String(attendanceKpis.leave), sub: `${attendanceKpis.total ? Math.round(attendanceKpis.leave / attendanceKpis.total * 100) : 0}% of workforce`, trend: "Current", up: true, icon: CalendarDays, color: "bg-sky-50 text-sky-600" },
    { label: "Late arrivals", value: String(attendanceKpis.late), sub: `${attendanceKpis.present ? Math.round(attendanceKpis.late / attendanceKpis.present * 100) : 0}% of present`, trend: "Current", up: true, icon: Clock3, color: "bg-amber-50 text-amber-600" },
  ];
  const filtered = useMemo(() => records.filter((row) => `${row.name} ${row.id} ${row.dept} ${row.status}`.toLowerCase().includes(query.toLowerCase()) && (!activeKpi || row.status.toLowerCase().includes(activeKpi.toLowerCase()))), [records, query, activeKpi]);

  const exportAttendance = () => {
    downloadCsv("attendance-2026-08-07.csv", [["Employee", "Employee ID", "Department", "Shift", "Check-in", "Check-out", "Effective hours", "Status"], ...filtered.map((row) => [row.name, row.id, row.dept, row.shift, row.in, row.out, row.hours, row.status])]);
    toast.success("Attendance exported as CSV");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div><p className="text-sm font-medium text-primary">People operations</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Attendance</h2><p className="mt-1 text-sm text-muted-foreground">Monitor today, resolve exceptions, and close the month with confidence.</p></div>
        <HeaderActions onAdd={() => toast.info("Manual attendance requires selecting an existing database employee from Daily attendance.")} onExport={exportAttendance} />
      </div>

      <div className="space-y-5">
        <div className="relative z-20 overflow-x-auto border-b" role="tablist" aria-label="Attendance sections"><div className="flex h-11 min-w-max items-end gap-1">
          {[["overview","Overview"],["daily","Daily attendance"],["monthly","Monthly"],["regularization","Regularization"],["shifts","Shifts & policies"],["reports","Reports"]].map(([value,label]) => <a href={`/admin/attendance?tab=${value}`} id={`attendance-tab-${value}`} role="tab" aria-controls={`attendance-panel-${value}`} aria-selected={activeTab === value} tabIndex={activeTab === value ? 0 : -1} key={value} onClick={() => setActiveTab(value)} className={`pointer-events-auto relative z-30 flex h-10 cursor-pointer items-center rounded-t-lg px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${activeTab === value ? "bg-accent/60 text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"}`}>{label}</a>)}
        </div></div>

        {activeTab === "overview" && <div id="attendance-panel-overview" aria-labelledby="attendance-tab-overview" role="tabpanel" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap gap-2"><Button variant="outline"><CalendarDays /> {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</Button><Button variant="outline"><Users /> {attendanceKpis.total} database employees</Button><Button variant="outline"><Filter /> More filters</Button></div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/></span>Live · updated just now</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map((kpi) => <button type="button" key={kpi.label} onClick={() => setActiveKpi(activeKpi === kpi.label.split(" ")[0] ? null : kpi.label.split(" ")[0])} className="text-left"><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}><kpi.icon className="h-5 w-5" /></span><Badge variant="outline" className={kpi.up ? "border-emerald-200 text-emerald-600" : "border-sky-200 text-sky-600"}>{kpi.up ? <ArrowUpRight/> : <ArrowDownRight/>}{kpi.trend}</Badge></div><div className="mt-4 text-3xl font-bold text-foreground">{kpi.value}</div><p className="mt-1 font-medium text-foreground">{kpi.label}</p><p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p></CardContent></Card></button>)}</div>
          <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <Card><CardHeader><CardTitle>Today&apos;s workforce</CardTitle><CardDescription>Attendance distribution across {attendanceKpis.total} database employees</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Present",attendanceKpis.present,"bg-emerald-500"],["Remote",attendanceKpis.remote,"bg-primary"],["Leave",attendanceKpis.leave,"bg-sky-500"],["Absent",attendanceKpis.absent,"bg-rose-500"]].map(([label,value,color]) => <div key={String(label)}><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-2 w-2 rounded-full ${color}`}/>{label}</div><p className="mt-1 text-xl font-semibold text-foreground">{value}</p></div>)}</div><div className="rounded-xl bg-muted/50 p-4"><div className="mb-3 flex justify-between text-sm"><span className="font-medium text-foreground">Present employees</span><span className="text-muted-foreground">{attendanceKpis.present} / {attendanceKpis.total}</span></div><Progress value={attendanceKpis.total ? attendanceKpis.present/attendanceKpis.total*100 : 0}/></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Needs attention</CardTitle><CardDescription>Database exceptions requiring action</CardDescription></CardHeader><CardContent className="space-y-3">{[[attendanceKpis.missingCheckout,"Missing check-outs","Employees currently without check-out",AlertTriangle,"text-orange-600 bg-orange-50"],[attendanceKpis.pendingRequests,"Regularization requests","Awaiting review",FileClock,"text-amber-600 bg-amber-50"]].map(([count,title,sub,Icon,color]) => { const C = Icon as typeof AlertTriangle; return <button type="button" key={String(title)} onClick={() => setActiveTab(String(title).startsWith("Regularization")?"regularization":"daily")} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-muted/50"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><C className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="block font-medium text-foreground">{String(title)}</span><span className="block truncate text-xs text-muted-foreground">{String(sub)}</span></span><span className="text-lg font-semibold text-foreground">{String(count)}</span></button>})}</CardContent></Card>
          </div>
          <AttendanceTable query={query} setQuery={setQuery} rows={filtered} />
        </div>}

        {activeTab === "daily" && <div id="attendance-panel-daily" aria-labelledby="attendance-tab-daily" role="tabpanel"><AttendanceTable query={query} setQuery={setQuery} rows={filtered} expanded /></div>}
        {activeTab === "monthly" && <div id="attendance-panel-monthly" aria-labelledby="attendance-tab-monthly" role="tabpanel"><MonthlyAttendance rows={matrixRows} selectedMonth={selectedMonth} today={today} locked={locked} onLock={async () => { const lastDay=new Date(Number(selectedMonth.slice(0,4)),Number(selectedMonth.slice(5,7)),0).getDate(); const result=await toggleAttendanceMonthLock(`${selectedMonth}-01`,`${selectedMonth}-${lastDay}`); if(!result.ok){toast.error(result.message);return} setLocked((value) => !value); toast.success(result.message); }} /></div>}
        {activeTab === "regularization" && <div id="attendance-panel-regularization" aria-labelledby="attendance-tab-regularization" role="tabpanel"><Regularization items={requestItems} onDecision={async (index, status) => { const request=requestItems[index]; if(!request)return; const result=await reviewRegularization(request.id,status.toLowerCase() as "approved"|"rejected"); if(!result.ok){toast.error(result.message);return} setRequestItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status } : item)); toast.success(result.message); }} /></div>}
        {activeTab === "shifts" && <div id="attendance-panel-shifts" aria-labelledby="attendance-tab-shifts" role="tabpanel"><OfficePolicyManager policies={shiftRows} departments={departments} companyTimezone={companyTimezone} /></div>}
        {activeTab === "reports" && <div id="attendance-panel-reports" aria-labelledby="attendance-tab-reports" role="tabpanel"><Reports /></div>}
      </div>
    </div>
  );
}

function AttendanceTable({ query, setQuery, rows, expanded = false }: { query: string; setQuery: (v:string)=>void; rows: AttendanceListRow[]; expanded?: boolean }) {
  return <Card><CardHeader><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><CardTitle>{expanded ? "Daily attendance" : "Live attendance"}</CardTitle><CardDescription>{expanded ? "Review all attendance records for 7 August 2026" : "Employees and their latest punch status"}</CardDescription></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search employees…" className="w-full pl-8 sm:w-56"/></div><Button variant="outline" size="icon" aria-label="Filter records"><Filter/></Button></div></div></CardHeader><CardContent className="px-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-y bg-muted/40 text-xs font-medium text-muted-foreground">{["Employee","Department","Shift","Check-in","Check-out","Effective hours","Status","Late by",""] .map((h)=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row)=><tr key={row.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">{row.avatar}</span><span><span className="block font-medium text-foreground">{row.name}</span><span className="text-xs text-muted-foreground">{row.id}</span></span></div></td><td className="px-4 py-3">{row.dept}</td><td className="px-4 py-3 text-muted-foreground">{row.shift}</td><td className="px-4 py-3 font-medium text-foreground">{row.in}</td><td className="px-4 py-3">{row.out}</td><td className="px-4 py-3">{row.hours}</td><td className="px-4 py-3"><AttendanceStatusBadge status={row.status}/></td><td className="px-4 py-3 text-amber-600">{row.late}</td><td className="px-4 py-3"><Button variant="ghost" size="icon" aria-label={`Actions for ${row.name}`} onClick={()=>toast.info(`${row.name}'s attendance details (demo)`)}><MoreHorizontal/></Button></td></tr>)}{rows.length===0&&<tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No attendance records match your search.</td></tr>}</tbody></table></div></CardContent></Card>;
}

function Regularization({ items, onDecision }: { items: typeof requests; onDecision: (index: number, status: string) => void }) { return <Card><CardHeader><CardTitle>Regularization requests</CardTitle><CardDescription>Review attendance corrections and supporting reasons.</CardDescription></CardHeader><CardContent className="space-y-3">{items.map((r,index)=><div key={r.name+r.date} className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-primary">{r.name.split(" ").map(n=>n[0]).join("")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{r.name}</p><AttendanceStatusBadge status={r.status}/></div><p className="mt-1 text-sm text-muted-foreground">{r.type} · {r.date} · Requested: <span className="font-medium text-foreground">{r.requested}</span></p><p className="mt-1 text-xs text-muted-foreground">Submitted {r.submitted}</p></div>{r.status==="Pending"&&<div className="flex gap-2"><Button variant="outline" onClick={()=>onDecision(index,"Rejected")}><XCircle/>Reject</Button><Button onClick={()=>onDecision(index,"Approved")}><CheckCircle2/>Approve</Button></div>}</div>)}</CardContent></Card> }

function Reports() { const reports=[["Daily attendance report","Live punch and status detail"],["Monthly attendance summary","Payroll-ready monthly totals"],["Late arrival report","Late frequency and duration"],["Missing punch report","Unresolved check-in/out exceptions"],["Overtime report","Calculated and approved overtime"],["Audit report","Complete attendance activity log"]]; return <Card><CardHeader><CardTitle>Attendance reports</CardTitle><CardDescription>Generate a filtered report or export a ready-made view.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reports.map(([title,sub])=><button key={title} onClick={()=>toast.success(`${title} prepared (demo)`)} className="group rounded-xl border p-4 text-left transition hover:border-primary/30 hover:bg-accent/40"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white"><Download/></span><p className="mt-4 font-medium text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></button>)}</div></CardContent></Card> }
