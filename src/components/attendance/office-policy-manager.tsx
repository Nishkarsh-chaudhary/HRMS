"use client";

import { useMemo, useState, useTransition } from "react";
import { Calculator, Clock3, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOfficePolicy, type OfficePolicyInput } from "@/lib/attendance/actions";

export type OfficePolicyView = OfficePolicyInput & { id: string; assigned: number };
type DepartmentOption = { id: string; name: string };

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const emptyPolicy = (timezone: string): OfficePolicyInput => ({
  name: "General shift", code: "GEN", startTime: "09:00", endTime: "18:00", timezone,
  graceMinutes: 15, fullDayMinutes: 480, halfDayMinutes: 240, breakMinutes: 30,
  breakMode: "fixed", overtimeMethod: "effective_hours", effectiveFrom: new Intl.DateTimeFormat("en-CA").format(new Date()),
  effectiveTo: null, overnight: false, weeklyOffs: [0, 6], location: null, departmentId: null,
});
const minutesLabel = (minutes: number) => `${Math.floor(minutes / 60)} hr${Math.floor(minutes / 60) === 1 ? "" : "s"}${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
const clockMinutes = (time: string) => { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; };

export function OfficePolicyManager({ policies, departments, companyTimezone }: { policies: OfficePolicyView[]; departments: DepartmentOption[]; companyTimezone: string }) {
  const [items, setItems] = useState(policies);
  const [policy, setPolicy] = useState<OfficePolicyInput>(() => policies[0] ?? emptyPolicy(companyTimezone));
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof OfficePolicyInput>(key: K, value: OfficePolicyInput[K]) => setPolicy((current) => ({ ...current, [key]: value }));
  const preview = useMemo(() => {
    const checkIn = clockMinutes(policy.startTime) + 32;
    let checkOut = clockMinutes(policy.endTime) + 15;
    if (checkOut <= checkIn) checkOut += 1440;
    const gross = checkOut - checkIn;
    const effective = Math.max(0, gross - policy.breakMinutes);
    return { late: Math.max(0, checkIn - clockMinutes(policy.startTime) - policy.graceMinutes), gross, effective, overtime: policy.overtimeMethod === "effective_hours" ? Math.max(0, effective - policy.fullDayMinutes) : 15, status: effective >= policy.fullDayMinutes ? "Present" : effective >= policy.halfDayMinutes ? "Half Day" : "Absent" };
  }, [policy]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveOfficePolicy(policy);
      if (!result.ok) { toast.error(result.message); return; }
      setItems((current) => policy.id ? current.map((item) => item.id === policy.id ? { ...item, ...policy } : item) : current);
      toast.success(result.message);
    });
  };

  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.5fr]">
    <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>Office policies</CardTitle><CardDescription>Effective-dated schedules and assignments</CardDescription></div><Button size="sm" onClick={() => setPolicy(emptyPolicy(companyTimezone))}><Plus />New</Button></div></CardHeader><CardContent className="space-y-3">{items.map((item) => <button type="button" key={item.id} onClick={() => setPolicy(item)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-muted/40 ${policy.id === item.id ? "border-primary bg-accent/40" : ""}`}><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Clock3 /></span><span className="min-w-0 flex-1"><span className="block font-medium">{item.name} <Badge variant="outline">{item.code}</Badge></span><span className="mt-1 block text-xs text-muted-foreground">{item.startTime} – {item.endTime} · {item.timezone}</span></span><span className="text-xs text-muted-foreground">{item.assigned} assigned</span></button>)}{items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No policies configured yet.</p>}</CardContent></Card>
    <form onSubmit={submit} className="space-y-5"><Card><CardHeader><CardTitle>{policy.id ? "Edit policy" : "Create office timing policy"}</CardTitle><CardDescription>Times are interpreted in the selected zone and stored as UTC on attendance records.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Policy name"><Input value={policy.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="Code"><Input value={policy.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required /></Field>
      <Field label="Time zone"><Input value={policy.timezone} onChange={(e) => set("timezone", e.target.value)} required /></Field>
      <Field label="Office starts"><Input type="time" value={policy.startTime} onChange={(e) => set("startTime", e.target.value)} required /></Field>
      <Field label="Office ends"><Input type="time" value={policy.endTime} onChange={(e) => set("endTime", e.target.value)} required /></Field>
      <Field label="Grace period (minutes)"><Input type="number" min={0} max={240} value={policy.graceMinutes} onChange={(e) => set("graceMinutes", Number(e.target.value))} required /></Field>
      <Field label="Full day (minutes)"><Input type="number" min={1} value={policy.fullDayMinutes} onChange={(e) => set("fullDayMinutes", Number(e.target.value))} required /></Field>
      <Field label="Half day (minutes)"><Input type="number" min={1} value={policy.halfDayMinutes} onChange={(e) => set("halfDayMinutes", Number(e.target.value))} required /></Field>
      <Field label="Standard break (minutes)"><Input type="number" min={0} value={policy.breakMinutes} onChange={(e) => set("breakMinutes", Number(e.target.value))} required /></Field>
      <Field label="Break calculation"><select className="h-9 w-full rounded-lg border bg-background px-3 text-sm" value={policy.breakMode} onChange={(e) => set("breakMode", e.target.value as "fixed" | "punches")}><option value="fixed">Deduct standard break</option><option value="punches">Use break punches</option></select></Field>
      <Field label="Overtime calculation"><select className="h-9 w-full rounded-lg border bg-background px-3 text-sm" value={policy.overtimeMethod} onChange={(e) => set("overtimeMethod", e.target.value as "effective_hours" | "after_shift_end")}><option value="effective_hours">Above required hours</option><option value="after_shift_end">After office end</option></select></Field>
      <Field label="Department"><select className="h-9 w-full rounded-lg border bg-background px-3 text-sm" value={policy.departmentId ?? ""} onChange={(e) => set("departmentId", e.target.value || null)}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
      <Field label="Location"><Input value={policy.location ?? ""} onChange={(e) => set("location", e.target.value || null)} placeholder="All locations" /></Field>
      <Field label="Effective from"><Input type="date" value={policy.effectiveFrom} onChange={(e) => set("effectiveFrom", e.target.value)} required /></Field>
      <Field label="Effective to"><Input type="date" value={policy.effectiveTo ?? ""} onChange={(e) => set("effectiveTo", e.target.value || null)} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Label>Weekly offs</Label><div className="mt-2 flex flex-wrap gap-2">{weekdays.map((day, index) => { const active = policy.weeklyOffs.includes(index); return <button type="button" key={day} onClick={() => set("weeklyOffs", active ? policy.weeklyOffs.filter((value) => value !== index) : [...policy.weeklyOffs, index])} className={`rounded-lg border px-3 py-2 text-xs font-medium ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{day}</button>; })}</div></div>
    </CardContent></Card>
    <Card><CardHeader><div className="flex items-center gap-2"><Calculator className="text-primary"/><div><CardTitle>Live calculation preview</CardTitle><CardDescription>Example: check-in 32 minutes after start, check-out 15 minutes after end</CardDescription></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Late by", minutesLabel(preview.late)],["Gross hours",minutesLabel(preview.gross)],["Break",minutesLabel(policy.breakMinutes)],["Effective",minutesLabel(preview.effective)],["Overtime",minutesLabel(preview.overtime)]].map(([label, value]) => <div key={label} className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><div className="mt-4 flex items-center justify-between rounded-xl bg-accent/50 p-3"><span className="text-sm text-muted-foreground">Resulting status</span><Badge>{preview.status}{preview.late > 0 ? ` · Late by ${preview.late} min` : ""}</Badge></div></CardContent></Card>
    <div className="flex justify-end"><Button type="submit" disabled={pending}><Save />{pending ? "Saving…" : "Save policy"}</Button></div></form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
