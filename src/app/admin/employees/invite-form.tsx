"use client";

import { useActionState, useState } from "react";
import { Loader2, CheckCircle2, Copy, LinkIcon } from "lucide-react";
import { createEmployeeInvite } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "finance", label: "Finance" },
  { value: "hr_admin", label: "HR Admin" },
];

type Option = { id: string; name: string };

export function InviteEmployeeForm({
  departments,
  designations,
  managers,
}: {
  departments: Option[];
  designations: Option[];
  managers: Option[];
}) {
  const [state, action, pending] = useActionState(createEmployeeInvite, undefined);
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [copied, setCopied] = useState(false);

  const copyInviteUrl = async () => {
    if (!state?.inviteUrl) return;
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form action={action} className="space-y-5">
      {state?.message && (
        <Alert variant={state.success ? "default" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state?.success && state.inviteUrl && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <LinkIcon className="h-4 w-4 shrink-0 text-primary" />
          <code className="min-w-0 flex-1 truncate text-xs text-foreground">{state.inviteUrl}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={copyInviteUrl}
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
          Full name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Priya Sharma"
          className="h-11 rounded-lg border-input bg-white px-4 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          aria-invalid={!!state?.errors?.fullName}
        />
        {state?.errors?.fullName && (
          <p className="text-sm text-destructive">{state.errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground">
          Work email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="priya@company.com"
          className="h-11 rounded-lg border-input bg-white px-4 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          aria-invalid={!!state?.errors?.email}
        />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-sm font-semibold text-foreground">
          Role
        </Label>
        <Select value={role} onValueChange={(v) => setRole(v ?? "employee")}>
          <SelectTrigger className="h-11 w-full justify-between rounded-lg border-input bg-white px-4 text-sm data-placeholder:text-muted-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
        {state?.errors?.role && (
          <p className="text-sm text-destructive">{state.errors.role}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departmentId" className="text-sm font-semibold text-foreground">
            Department
          </Label>
          <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
            <SelectTrigger className="h-11 w-full justify-between rounded-lg border-input bg-white px-4 text-sm data-placeholder:text-muted-foreground">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="departmentId" value={departmentId} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="designationId" className="text-sm font-semibold text-foreground">
            Designation
          </Label>
          <Select value={designationId} onValueChange={(v) => setDesignationId(v ?? "")}>
            <SelectTrigger className="h-11 w-full justify-between rounded-lg border-input bg-white px-4 text-sm data-placeholder:text-muted-foreground">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {designations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="designationId" value={designationId} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportingManagerId" className="text-sm font-semibold text-foreground">
          Reporting manager
        </Label>
        <Select value={reportingManagerId} onValueChange={(v) => setReportingManagerId(v ?? "")}>
          <SelectTrigger className="h-11 w-full justify-between rounded-lg border-input bg-white px-4 text-sm data-placeholder:text-muted-foreground">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="reportingManagerId" value={reportingManagerId} />
      </div>

      <Button
        type="submit"
        className={cn("h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90")}
        disabled={pending}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send invitation
      </Button>
    </form>
  );
}
