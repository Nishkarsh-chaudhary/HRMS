import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { updateEmployee } from "@/lib/employees/actions";
import { EmployeeOnboardingForm, type EmployeeFormValues } from "../../create/employee-onboarding-form";
import type { Json } from "@/types/database";

function record(value: Json): Record<string, string> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item == null ? "" : String(item)]));
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUserAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: employee }, { data: departments }, { data: designations }, { data: managers }] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).eq("company_id", admin.company_id).maybeSingle(),
    supabase.from("departments").select("id, name").eq("company_id", admin.company_id).order("name"),
    supabase.from("designations").select("id, name").eq("company_id", admin.company_id).order("name"),
    supabase.from("users").select("id, full_name").eq("company_id", admin.company_id).neq("id", id).order("full_name"),
  ]);
  if (!employee) notFound();

  const current = record(employee.current_address);
  const permanent = record(employee.permanent_address);
  const emergency = record(employee.emergency_contact);
  const bank = record(employee.bank_details);
  const statutory = record(employee.statutory_details);
  const initialValues: EmployeeFormValues = {
    firstName: employee.first_name ?? "", middleName: employee.middle_name ?? "", lastName: employee.last_name ?? "",
    employeeCode: employee.employee_code ?? "", dateOfBirth: employee.date_of_birth ?? "", gender: employee.gender ?? "",
    maritalStatus: employee.marital_status ?? "", bloodGroup: employee.blood_group ?? "", personalEmail: employee.personal_email ?? "",
    mobileNumber: employee.mobile_number ?? "", alternateMobileNumber: employee.alternate_mobile_number ?? "",
    dateOfJoining: employee.date_of_joining ?? "", employmentType: employee.employment_type ?? "permanent", employmentStatus: employee.employment_status,
    probationMonths: employee.probation_months == null ? "" : String(employee.probation_months), confirmationDate: employee.confirmation_date ?? "",
    workMode: employee.work_mode ?? "office", workLocation: employee.work_location ?? "", shiftName: employee.shift_name ?? "",
    weeklyOffPolicy: employee.weekly_off_policy ?? "", noticePeriodDays: employee.notice_period_days == null ? "" : String(employee.notice_period_days),
    officialEmail: employee.email, officialMobileNumber: employee.official_mobile_number ?? "",
    departmentId: employee.department_id ?? "", designationId: employee.designation_id ?? "", reportingManagerId: employee.reporting_manager_id ?? "",
    secondaryManagerId: employee.secondary_manager_id ?? "", teamName: employee.team_name ?? "", costCentre: employee.cost_centre ?? "",
    grade: employee.grade ?? "", employeeLevel: employee.employee_level ?? "",
    currentAddressLine1: current.line1 ?? "", currentAddressLine2: current.line2 ?? "", currentCity: current.city ?? "",
    currentState: current.state ?? "", currentPinCode: current.pinCode ?? "",
    permanentSameAsCurrent: Boolean(current.line1 && current.line1 === permanent.line1 && current.city === permanent.city && current.state === permanent.state && current.pinCode === permanent.pinCode),
    permanentAddressLine1: permanent.line1 ?? "", permanentCity: permanent.city ?? "", permanentState: permanent.state ?? "", permanentPinCode: permanent.pinCode ?? "",
    emergencyContactName: emergency.name ?? "", emergencyRelationship: emergency.relationship ?? "", emergencyMobile: emergency.mobile ?? "",
    accountHolderName: bank.accountHolderName ?? "", bankName: bank.bankName ?? "", accountNumber: bank.accountNumber ?? "",
    confirmAccountNumber: bank.accountNumber ?? "", ifscCode: bank.ifscCode ?? "", panNumber: statutory.panNumber ?? "",
    aadhaarNumber: statutory.aadhaarNumber ?? "", uanNumber: statutory.uanNumber ?? "", esiNumber: statutory.esiNumber ?? "",
    taxRegime: statutory.taxRegime ?? "", role: employee.role, hasLogin: Boolean(employee.auth_user_id),
  };
  const action = updateEmployee.bind(null, employee.id);

  return <div className="space-y-5">
    <div><Link href={`/admin/employees/${employee.id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Back to profile</Link><h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Employee</h2><p className="mt-1 text-sm text-muted-foreground">Edit all employee information, organisation mapping, access, bank, statutory, and contact details.</p></div>
    <EmployeeOnboardingForm departments={departments ?? []} designations={designations ?? []} managers={(managers ?? []).map((manager) => ({ id: manager.id, name: manager.full_name }))} initialValues={initialValues} mode="edit" formAction={action} />
  </div>;
}
