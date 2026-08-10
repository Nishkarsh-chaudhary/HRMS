"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileCheck2, Landmark, Loader2, MapPin, ShieldCheck, UserRound, UsersRound, BriefcaseBusiness } from "lucide-react";
import { createEmployee } from "@/lib/employees/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
export type EmployeeFormValues = Record<string, string | boolean>;
type EmployeeFormAction = (state: EmployeeFormState, formData: FormData) => Promise<EmployeeFormState>;
import type { EmployeeFormState } from "@/lib/employees/definitions";
const InitialValuesContext = createContext<EmployeeFormValues>({});
const steps = [
  { title: "Basic Information", icon: UserRound },
  { title: "Employment Details", icon: BriefcaseBusiness },
  { title: "Organisation Mapping", icon: UsersRound },
  { title: "Contact & Address", icon: MapPin },
  { title: "Bank & Statutory", icon: Landmark },
  { title: "Access & Permissions", icon: ShieldCheck },
  { title: "Documents", icon: FileCheck2 },
  { title: "Review & Create", icon: Check },
];

function Field({ label, name, type = "text", placeholder, defaultValue, error }: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; error?: string[] }) {
  const initialValues = useContext(InitialValuesContext);
  return <div className="space-y-2"><Label htmlFor={name} className="text-xs font-semibold text-foreground">{label}</Label><Input id={name} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue ?? String(initialValues[name] ?? "")} aria-invalid={!!error} className="h-10 bg-white" />{error && <p className="text-xs text-destructive">{error[0]}</p>}</div>;
}

function SelectField({ label, name, options, defaultValue = "", error }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string; error?: string[] }) {
  const initialValues = useContext(InitialValuesContext);
  return <div className="space-y-2"><Label htmlFor={name} className="text-xs font-semibold text-foreground">{label}</Label><select id={name} name={name} defaultValue={String(initialValues[name] ?? defaultValue)} aria-invalid={!!error} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-foreground"><option value="">Select</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error && <p className="text-xs text-destructive">{error[0]}</p>}</div>;
}

export function EmployeeOnboardingForm({ departments, designations, managers, initialValues = {}, mode = "create", formAction = createEmployee }: { departments: Option[]; designations: Option[]; managers: Option[]; initialValues?: EmployeeFormValues; mode?: "create" | "edit"; formAction?: EmployeeFormAction }) {
  const [state, action, pending] = useActionState(formAction, undefined);
  const [step, setStep] = useState(0);
  const [clientError, setClientError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const errors = state?.errors ?? {};
  const section = (index: number) => cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", step !== index && "hidden");

  useEffect(() => {
    if (!pending) submittingRef.current = false;
  }, [pending]);

  function continueToNextStep() {
    if (!formRef.current) return;
    const values = new FormData(formRef.current);
    const requiredByStep: Record<number, Array<[string, string]>> = {
      0: [["firstName", "First name"], ["lastName", "Last name"], ["employeeCode", "Employee ID"], ["mobileNumber", "Mobile number"]],
      1: [["dateOfJoining", "Date of joining"], ["employmentType", "Employment type"], ["employmentStatus", "Employee status"], ["workMode", "Work mode"], ["workLocation", "Work location"], ["officialEmail", "Official email"]],
      2: [["departmentId", "Department"], ["designationId", "Designation"]],
    };
    const missing = (requiredByStep[step] ?? []).filter(([name]) => !String(values.get(name) ?? "").trim()).map(([, fieldLabel]) => fieldLabel);
    if (missing.length) {
      setClientError(`${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required before continuing.`);
      return;
    }
    if (step === 0 && !/^[6-9]\d{9}$/.test(String(values.get("mobileNumber") ?? ""))) {
      setClientError("Enter a valid 10-digit Indian mobile number before continuing.");
      return;
    }
    if (step === 1 && !/^\S+@\S+\.\S+$/.test(String(values.get("officialEmail") ?? ""))) {
      setClientError("Enter a valid official email before continuing.");
      return;
    }
    if (step === 5 && (values.get("createLogin") || values.get("manageLogin"))) {
      const password = String(values.get("temporaryPassword") ?? "");
      const confirmation = String(values.get("confirmTemporaryPassword") ?? "");
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        setClientError("The temporary password needs at least 8 characters with uppercase, lowercase, and a number.");
        return;
      }
      if (password !== confirmation) {
        setClientError("Temporary password and confirmation do not match.");
        return;
      }
    }
    setClientError("");
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  return (
    <InitialValuesContext.Provider value={initialValues}>
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (step !== steps.length - 1) {
          continueToNextStep();
          return;
        }
        if (submittingRef.current) return;
        submittingRef.current = true;
        setClientError("");
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]"
    >
      <Card className="h-fit border-border/80 bg-white shadow-none"><CardContent className="p-3"><ol className="space-y-1">{steps.map((item, index) => <li key={item.title}><button type="button" onClick={() => { if (mode === "edit" || index <= step) { setClientError(""); setStep(index); } else if (index === step + 1) { continueToNextStep(); } else { setClientError("Complete the current step before moving ahead."); } }} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition", step === index ? "bg-primary text-white shadow-md shadow-primary/20" : index < step ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted")}><span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", step === index ? "bg-white/15" : index < step ? "bg-emerald-50 text-emerald-600" : "bg-muted")} >{index < step ? <Check className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}</span><span><span className="block text-[11px] opacity-70">Step {index + 1}</span><span className="block text-xs font-semibold">{item.title}</span></span></button></li>)}</ol></CardContent></Card>

      <Card className="border-border/80 bg-white shadow-none"><CardContent className="p-0">
        <div className="border-b border-border px-6 py-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Step {step + 1} of {steps.length}</p><h3 className="mt-1 text-lg font-bold text-foreground">{steps[step].title}</h3><p className="mt-1 text-sm text-muted-foreground">Complete the employee information below. Sensitive data is protected by role access.</p></div>
        <div className="p-6">
          {clientError && <Alert variant="destructive" className="mb-5"><AlertCircle /><AlertDescription>{clientError}</AlertDescription></Alert>}
          {state?.message && <Alert variant="destructive" className="mb-5"><AlertCircle /><AlertDescription>{state.message}</AlertDescription></Alert>}

          <div className={section(0)}>
            <Field label="First Name *" name="firstName" placeholder="Aarav" error={errors.firstName} /><Field label="Middle Name" name="middleName" /><Field label="Last Name *" name="lastName" placeholder="Sharma" error={errors.lastName} />
            <Field label="Employee ID *" name="employeeCode" placeholder="JBS-0012" error={errors.employeeCode} /><Field label="Date of Birth" name="dateOfBirth" type="date" /><SelectField label="Gender" name="gender" options={["Male", "Female", "Non-binary", "Prefer not to say"].map((value) => ({ value: value.toLowerCase().replaceAll(" ", "_"), label: value }))} />
            <SelectField label="Marital Status" name="maritalStatus" options={["Single", "Married", "Other"].map((value) => ({ value: value.toLowerCase(), label: value }))} /><SelectField label="Blood Group" name="bloodGroup" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => ({ value, label: value }))} /><Field label="Personal Email" name="personalEmail" type="email" error={errors.personalEmail} />
            <Field label="Mobile Number *" name="mobileNumber" placeholder="9876543210" error={errors.mobileNumber} /><Field label="Alternate Mobile" name="alternateMobileNumber" />
          </div>

          <div className={section(1)}>
            <Field label="Date of Joining *" name="dateOfJoining" type="date" error={errors.dateOfJoining} /><SelectField label="Employment Type *" name="employmentType" defaultValue="permanent" options={["permanent", "probation", "contract", "intern", "consultant"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} error={errors.employmentType} /><SelectField label="Employee Status *" name="employmentStatus" defaultValue="onboarding" options={["onboarding", "active", "notice_period", "inactive", "resigned", "terminated", "archived"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
            <Field label="Probation (months)" name="probationMonths" type="number" defaultValue="6" /><Field label="Confirmation Date" name="confirmationDate" type="date" /><SelectField label="Work Mode *" name="workMode" defaultValue="office" options={["office", "hybrid", "remote", "field"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
            <Field label="Work Location *" name="workLocation" placeholder="Noida Office" error={errors.workLocation} /><Field label="Shift" name="shiftName" placeholder="General Shift" /><Field label="Weekly Off Policy" name="weeklyOffPolicy" placeholder="Saturday–Sunday" />
            <Field label="Notice Period (days)" name="noticePeriodDays" type="number" defaultValue="30" /><Field label="Official Email *" name="officialEmail" type="email" error={errors.officialEmail} /><Field label="Official Mobile" name="officialMobileNumber" />
          </div>

          <div className={section(2)}>
            <SelectField label="Department *" name="departmentId" options={departments.map((item) => ({ value: item.id, label: item.name }))} error={errors.departmentId} /><SelectField label="Designation *" name="designationId" options={designations.map((item) => ({ value: item.id, label: item.name }))} error={errors.designationId} /><SelectField label="Reporting Manager" name="reportingManagerId" options={managers.map((item) => ({ value: item.id, label: item.name }))} error={errors.reportingManagerId} />
            <SelectField label="Secondary Manager" name="secondaryManagerId" options={managers.map((item) => ({ value: item.id, label: item.name }))} /><Field label="Team" name="teamName" placeholder="Platform Engineering" /><Field label="Cost Centre" name="costCentre" placeholder="CC-TECH-01" /><Field label="Grade" name="grade" placeholder="G5" /><Field label="Employee Level" name="employeeLevel" placeholder="Senior Associate" />
          </div>

          <div className={section(3)}>
            <Field label="Current Address Line 1" name="currentAddressLine1" /><Field label="Current Address Line 2" name="currentAddressLine2" /><Field label="City" name="currentCity" /><Field label="State" name="currentState" /><Field label="PIN Code" name="currentPinCode" error={errors.currentPinCode} />
            <div className="flex items-center gap-2 pt-7"><Checkbox id="permanentSameAsCurrent" name="permanentSameAsCurrent" defaultChecked={initialValues.permanentSameAsCurrent === true} /><Label htmlFor="permanentSameAsCurrent">Permanent address is the same</Label></div>
            <Field label="Permanent Address" name="permanentAddressLine1" /><Field label="Permanent City" name="permanentCity" /><Field label="Permanent State" name="permanentState" /><Field label="Permanent PIN" name="permanentPinCode" error={errors.permanentPinCode} />
            <Field label="Emergency Contact Name" name="emergencyContactName" /><Field label="Relationship" name="emergencyRelationship" /><Field label="Emergency Mobile" name="emergencyMobile" />
          </div>

          <div className={section(4)}>
            <Field label="Account Holder Name" name="accountHolderName" /><Field label="Bank Name" name="bankName" /><Field label="Account Number" name="accountNumber" /><Field label="Confirm Account Number" name="confirmAccountNumber" error={errors.confirmAccountNumber} /><Field label="IFSC Code" name="ifscCode" error={errors.ifscCode} />
            <Field label="PAN Number" name="panNumber" error={errors.panNumber} /><Field label="Aadhaar Number" name="aadhaarNumber" error={errors.aadhaarNumber} /><Field label="UAN Number" name="uanNumber" /><Field label="ESI Number" name="esiNumber" /><SelectField label="Tax Regime" name="taxRegime" options={[{ value: "old", label: "Old Regime" }, { value: "new", label: "New Regime" }]} />
          </div>

          <div className={section(5)}>
            {mode === "create" ? <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2"><Checkbox id="createLogin" name="createLogin" defaultChecked={initialValues.createLogin !== false} /><Label htmlFor="createLogin" className="font-semibold">Create Login Account</Label></div><p className="mt-2 text-xs text-muted-foreground">The official email is the employee&apos;s login ID. Supabase Auth stores the password securely.</p></div> : <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2"><Checkbox id="manageLogin" name="manageLogin" /><Label htmlFor="manageLogin" className="font-semibold">{initialValues.hasLogin ? "Reset Login Password" : "Create Login Account"}</Label></div><p className="mt-2 text-xs text-muted-foreground">{initialValues.hasLogin ? "Set a new temporary password for the existing login account." : "Create a login using the official email as the employee ID."}</p></div>}
            <SelectField label="User Role" name="role" defaultValue="employee" options={[...(mode === "edit" && initialValues.role === "super_admin" ? [{ value: "super_admin", label: "Super Admin" }] : []), { value: "employee", label: "Employee" }, { value: "manager", label: "Manager" }, { value: "hr_admin", label: "HR Admin" }, { value: "finance", label: "Finance" }]} />
            <Field label={`Temporary Password${mode === "create" ? " *" : ""}`} name="temporaryPassword" type="password" error={errors.temporaryPassword} /><Field label={`Confirm Temporary Password${mode === "create" ? " *" : ""}`} name="confirmTemporaryPassword" type="password" error={errors.confirmTemporaryPassword} />
            <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2"><Checkbox id="sendWelcomeEmail" name="sendWelcomeEmail" defaultChecked={mode === "create" && initialValues.sendWelcomeEmail !== false} /><Label htmlFor="sendWelcomeEmail" className="font-semibold">Send Login Email</Label></div><p className="mt-2 text-xs text-muted-foreground">Sends the login ID and sign-in link. The temporary password is never emailed.</p></div>
          </div>

          <div className={cn("space-y-4", step !== 6 && "hidden")}><div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center"><FileCheck2 className="mx-auto h-9 w-9 text-primary" /><h4 className="mt-3 font-semibold text-foreground">{mode === "create" ? "Documents are added after employee creation" : "Manage documents from the employee profile"}</h4><p className="mt-1 text-sm text-muted-foreground">The employee profile includes secure slots for Aadhaar, PAN, bank proof, offer letter, and other documents.</p></div></div>
          <div className={cn("space-y-4", step !== 7 && "hidden")}><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><h4 className="font-semibold text-emerald-800">Ready to {mode === "create" ? "create" : "update"} the employee</h4><p className="mt-1 text-sm text-emerald-700">Review previous sections using the step menu. The server will validate required fields, duplicate IDs, emails, PAN formats, Aadhaar, IFSC, mobile numbers, and account confirmation.</p></div>{Object.keys(errors).length > 0 && <Alert variant="destructive"><AlertCircle /><AlertDescription>Some fields need attention. Use the step menu to review highlighted errors.</AlertDescription></Alert>}</div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-white/95 px-6 py-4 backdrop-blur"><Button type="button" variant="outline" disabled={step === 0 || pending} onClick={() => { setClientError(""); setStep((value) => Math.max(0, value - 1)); }}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>{step < steps.length - 1 ? <Button type="button" onClick={continueToNextStep}>Save & Continue<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button type="submit" disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{mode === "create" ? "Create Employee" : "Save All Changes"}</Button>}</div>
      </CardContent></Card>
    </form>
    </InitialValuesContext.Provider>
  );
}
