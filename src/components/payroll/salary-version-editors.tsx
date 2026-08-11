"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { editSalaryComponent, editSalaryTemplate } from "@/lib/payroll/actions";
import type { ComponentView, TemplateView } from "@/components/payroll/salary-management-table";
import type { CalculationMethod, ComponentType } from "@/lib/payroll/calculation-engine";

const today = () => new Intl.DateTimeFormat("en-CA").format(new Date());
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function ComponentVersionEditor({ components, canConfigure }: { components: ComponentView[]; canConfigure: boolean }) {
  const [selectedId, setSelectedId] = useState(components[0]?.id ?? "");
  const selected = components.find((item) => item.id === selectedId);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<CalculationMethod>("fixed");
  const [type, setType] = useState<ComponentType>("earning");
  const [amount, setAmount] = useState("");
  const [percentage, setPercentage] = useState("");
  const [bases, setBases] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!selected) return;
    // Reset the controlled editor when the administrator chooses another record.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(selected.name); setCode(selected.code); setMethod(selected.method); setType(selected.type);
    setAmount(selected.fixedAmount === undefined ? "" : String(selected.fixedAmount));
    setPercentage(selected.percentage === undefined ? "" : String(selected.percentage));
    setBases(selected.baseComponentCodes ?? []); setEffectiveFrom(today()); setReason("");
  }, [selected]);

  const submit = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await editSalaryComponent({
        id: selected.id, name, code, componentType: type, calculationMethod: method,
        fixedAmount: ["fixed", "manual"].includes(method) ? Number(amount) : undefined,
        percentage: method.startsWith("percentage") ? Number(percentage) : undefined,
        baseComponentCodes: bases, priority: selected.priority ?? 100,
        includeInGross: selected.includeInGross ?? type === "earning",
        includeInNet: selected.includeInNet ?? !["employer_contribution", "informational"].includes(type),
        includeInCtc: selected.includeInCtc ?? ["earning", "employer_contribution"].includes(type),
        prorate: selected.prorate ?? true, allowEmployeeOverride: selected.allowEmployeeOverride ?? false,
        showOnSalarySlip: selected.showOnSalarySlip ?? true, effectiveFrom, status: "active", changeReason: reason,
      });
      result.ok ? toast.success(result.message) : toast.error(result.message);
    });
  };

  return <Card><CardHeader><CardTitle>Edit component</CardTitle><CardDescription>Active components are changed by creating a new effective-dated version.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
    <Field title="Component"><Select value={selectedId} onValueChange={(value) => setSelectedId(value ?? "")}><SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger><SelectContent>{components.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · v{item.version}</SelectItem>)}</SelectContent></Select></Field>
    <Field title="Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
    <Field title="Code"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} /></Field>
    <Field title="Type"><Select value={type} onValueChange={(value) => value && setType(value as ComponentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["earning","employee_deduction","employer_contribution","reimbursement","informational"].map((item) => <SelectItem key={item} value={item}>{label(item)}</SelectItem>)}</SelectContent></Select></Field>
    <Field title="Calculation"><Select value={method} onValueChange={(value) => value && setMethod(value as CalculationMethod)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["fixed","percentage_of_ctc","percentage_of_gross","percentage_of_component","percentage_of_components","balancing","manual"].map((item) => <SelectItem key={item} value={item}>{label(item)}</SelectItem>)}</SelectContent></Select></Field>
    {["fixed", "manual"].includes(method) && <Field title="Monthly amount"><Input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>}
    {method.startsWith("percentage") && <Field title="Percentage"><Input type="number" min="0" value={percentage} onChange={(event) => setPercentage(event.target.value)} /></Field>}
    {["percentage_of_component", "percentage_of_components"].includes(method) && <div className="space-y-2 md:col-span-2"><Label>Calculation base</Label><div className="grid gap-2 sm:grid-cols-2">{components.filter((item) => item.id !== selectedId).map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><Checkbox checked={bases.includes(item.code)} onCheckedChange={(checked) => setBases((current) => checked ? [...current, item.code] : current.filter((codeValue) => codeValue !== item.code))} />{item.name}</label>)}</div></div>}
    <Field title="New version effective from"><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></Field>
    <Field title="Change reason"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for this version" /></Field>
    <Button className="md:col-span-2" onClick={submit} disabled={!canConfigure || pending || !selected || reason.trim().length < 3}><Pencil />{pending ? "Saving…" : selected?.status === "draft" ? "Update draft" : "Create new version"}</Button>
  </CardContent></Card>;
}

export function TemplateVersionEditor({ templates, components, canConfigure }: { templates: TemplateView[]; components: ComponentView[]; canConfigure: boolean }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? ""); const selected = templates.find((item) => item.id === selectedId);
  const [name, setName] = useState(""); const [code, setCode] = useState(""); const [componentIds, setComponentIds] = useState<string[]>([]); const [effectiveFrom, setEffectiveFrom] = useState(today()); const [reason, setReason] = useState(""); const [pending, startTransition] = useTransition();
  const codeToId = useMemo(() => new Map(components.map((item) => [item.code, item.id])), [components]);
  useEffect(() => { if (!selected) return;
    // Reset the controlled editor when the administrator chooses another record.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(selected.name); setCode(selected.code); setComponentIds(selected.components.map((item) => codeToId.get(item.code)).filter((id): id is string => Boolean(id))); setEffectiveFrom(today()); setReason(""); }, [selected, codeToId]);
  const submit = () => { if (!selected) return; startTransition(async () => { const result = await editSalaryTemplate({id:selected.id,name,code,description:"Reusable dynamic salary structure",salaryInputType:selected.salaryInputType as "annual_ctc"|"monthly_ctc"|"monthly_gross"|"basic"|"manual",componentIds,effectiveFrom,status:"active",changeReason:reason}); result.ok ? toast.success(result.message) : toast.error(result.message); }); };
  return <Card><CardHeader><CardTitle>Edit template</CardTitle><CardDescription>Existing employee snapshots remain unchanged when a new template version is created.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
    <Field title="Template"><Select value={selectedId} onValueChange={(value) => setSelectedId(value ?? "")}><SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger><SelectContent>{templates.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · v{item.version}</SelectItem>)}</SelectContent></Select></Field>
    <Field title="Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field title="Code"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} /></Field><Field title="New version effective from"><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></Field>
    <div className="space-y-2 md:col-span-2"><Label>Components</Label><div className="grid gap-2 sm:grid-cols-2">{components.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><Checkbox checked={componentIds.includes(item.id)} onCheckedChange={(checked) => setComponentIds((current) => checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />{item.name}</label>)}</div></div>
    <Field title="Change reason"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for this version" /></Field>
    <Button className="self-end" onClick={submit} disabled={!canConfigure || pending || !selected || !componentIds.length || reason.trim().length < 3}><Pencil />{pending ? "Saving…" : selected?.status === "draft" ? "Update draft" : "Create new version"}</Button>
  </CardContent></Card>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{title}</Label>{children}</div>; }
