"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeSchema, type EmployeeFormState } from "@/lib/employees/definitions";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email";

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function calculateCompletion(values: Record<string, unknown>) {
  const important = ["firstName", "lastName", "employeeCode", "mobileNumber", "dateOfJoining", "officialEmail", "departmentId", "designationId", "workLocation", "currentAddressLine1", "bankName", "panNumber"];
  const complete = important.filter((key) => Boolean(values[key])).length;
  return Math.max(20, Math.round((complete / important.length) * 100));
}

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function employeeCreateErrorMessage(error: DatabaseError | null) {
  if (!error) return "Employee could not be created. Please try again.";

  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.toLowerCase().includes("schema cache")
  ) {
    return "Employee Management database setup is incomplete. Ask an administrator to apply migration 00003_employee_management.sql, then try again.";
  }

  if (error.code === "23505") {
    return "Employee ID or official email already exists in this company.";
  }

  if (error.code === "23503") {
    return "The selected department, designation, or reporting manager is no longer available. Refresh the page and select it again.";
  }

  if (error.code === "23514" || error.code === "22007") {
    return "One or more employee details have an invalid value. Review the highlighted fields and try again.";
  }

  if (error.code === "42501") {
    return "You do not have permission to create employees for this company.";
  }

  return "Employee could not be created because of a database error. Please try again or contact an administrator.";
}

export async function createEmployee(
  _state: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const admin = await requireUserAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = EmployeeSchema.safeParse({
    ...raw,
    createLogin: checkbox(formData, "createLogin"),
    sendWelcomeEmail: checkbox(formData, "sendWelcomeEmail"),
    permanentSameAsCurrent: checkbox(formData, "permanentSameAsCurrent"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const supabase = await createClient();
  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
  const authAdmin = createAdminClient();
  let authUserId: string | null = null;
  if (data.createLogin && data.temporaryPassword) {
    const { data: authResult, error: authError } = await authAdmin.auth.admin.createUser({
      email: data.officialEmail,
      password: data.temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { company_id: admin.company_id, role: data.role },
    });
    if (authError || !authResult.user) {
      return { message: authError?.message?.toLowerCase().includes("already") ? "A login account with this official email already exists." : "The employee login account could not be created. Please try again." };
    }
    authUserId = authResult.user.id;
  }
  const currentAddress = {
    line1: data.currentAddressLine1, line2: data.currentAddressLine2,
    city: data.currentCity, state: data.currentState, pinCode: data.currentPinCode, country: "India",
  };
  const permanentAddress = data.permanentSameAsCurrent ? currentAddress : {
    line1: data.permanentAddressLine1, city: data.permanentCity,
    state: data.permanentState, pinCode: data.permanentPinCode, country: "India",
  };

  const { data: employee, error } = await supabase.from("users").insert({
    company_id: admin.company_id,
    auth_user_id: authUserId,
    full_name: fullName,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    employee_code: data.employeeCode,
    email: data.officialEmail,
    personal_email: data.personalEmail,
    mobile_number: data.mobileNumber,
    alternate_mobile_number: data.alternateMobileNumber,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    marital_status: data.maritalStatus,
    blood_group: data.bloodGroup,
    date_of_joining: data.dateOfJoining,
    employment_type: data.employmentType,
    employment_status: data.employmentStatus,
    probation_months: data.probationMonths ?? null,
    confirmation_date: data.confirmationDate,
    work_mode: data.workMode,
    work_location: data.workLocation,
    shift_name: data.shiftName,
    weekly_off_policy: data.weeklyOffPolicy,
    notice_period_days: data.noticePeriodDays ?? null,
    official_mobile_number: data.officialMobileNumber,
    department_id: data.departmentId,
    designation_id: data.designationId,
    reporting_manager_id: data.reportingManagerId,
    secondary_manager_id: data.secondaryManagerId,
    team_name: data.teamName,
    cost_centre: data.costCentre,
    grade: data.grade,
    employee_level: data.employeeLevel,
    current_address: currentAddress,
    permanent_address: permanentAddress,
    emergency_contact: { name: data.emergencyContactName, relationship: data.emergencyRelationship, mobile: data.emergencyMobile },
    bank_details: { accountHolderName: data.accountHolderName, bankName: data.bankName, accountNumber: data.accountNumber, ifscCode: data.ifscCode },
    statutory_details: { panNumber: data.panNumber, aadhaarNumber: data.aadhaarNumber, uanNumber: data.uanNumber, esiNumber: data.esiNumber, taxRegime: data.taxRegime },
    profile_completion: calculateCompletion(data),
    role: data.role,
    status: "active",
    invited_by: admin.id,
    invite_token: null,
    invite_expires_at: null,
  }).select("id").single();

  if (error || !employee) {
    if (authUserId) await authAdmin.auth.admin.deleteUser(authUserId);
    console.error("[employees:create] Database insert failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return {
      message: employeeCreateErrorMessage(error),
    };
  }

  await supabase.from("audit_logs").insert({
    company_id: admin.company_id,
    actor_user_id: admin.id,
    entity_type: "employee",
    entity_id: employee.id,
    action: "created",
    changes: { employeeCode: data.employeeCode, employmentStatus: data.employmentStatus, role: data.role },
  });

  if (authUserId && data.sendWelcomeEmail) {
    const siteUrl = await getSiteUrl();
    const loginUrl = `${siteUrl}/login`;
    await sendEmail({
      to: data.officialEmail,
      subject: "Your HRMS login account is ready",
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px"><h2>Your HRMS account is ready</h2><p>Hi ${escapeHtml(fullName)},</p><p>Your login ID is <strong>${escapeHtml(data.officialEmail)}</strong>. Use the temporary password shared securely by your administrator.</p><p><a href="${loginUrl}">Sign in to HRMS</a></p><p style="font-size:12px;color:#777">For security, passwords are never included in email.</p></div>`,
    });
  }

  revalidatePath("/admin/employees");
  redirect("/admin/employees?created=1");
}

export async function changeEmployeeStatus(formData: FormData) {
  const admin = await requireUserAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["active", "onboarding", "notice_period", "inactive", "resigned", "terminated", "archived"];
  if (!employeeId || !allowed.includes(status)) return;

  const supabase = await createClient();
  const { data: employee } = await supabase.from("users")
    .select("id, employment_status")
    .eq("id", employeeId)
    .eq("company_id", admin.company_id)
    .maybeSingle();
  if (!employee) return;

  await supabase.from("users").update({
    employment_status: status,
    archived_at: status === "archived" ? new Date().toISOString() : null,
    status: status === "active" ? "active" : status === "archived" ? "deactivated" : undefined,
  }).eq("id", employee.id).eq("company_id", admin.company_id);
  await supabase.from("audit_logs").insert({
    company_id: admin.company_id,
    actor_user_id: admin.id,
    entity_type: "employee",
    entity_id: employee.id,
    action: "status_changed",
    changes: { from: employee.employment_status, to: status },
  });
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employee.id}`);
}

export async function updateEmployee(employeeId: string, _state: EmployeeFormState, formData: FormData): Promise<EmployeeFormState> {
  const admin = await requireUserAdmin();
  const raw = Object.fromEntries(formData);
  const requestedRole = String(formData.get("role") ?? "employee");
  const manageLogin = checkbox(formData, "manageLogin");
  const parsed = EmployeeSchema.safeParse({
    ...raw,
    role: requestedRole === "super_admin" ? "hr_admin" : requestedRole,
    createLogin: manageLogin,
    sendWelcomeEmail: checkbox(formData, "sendWelcomeEmail"),
    permanentSameAsCurrent: checkbox(formData, "permanentSameAsCurrent"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const supabase = await createClient();
  const { data: employee } = await supabase.from("users").select("id, auth_user_id, full_name, email, employee_code, role").eq("id", employeeId).eq("company_id", admin.company_id).maybeSingle();
  if (!employee) return { message: "Employee could not be found." };
  if (data.reportingManagerId === employee.id || data.secondaryManagerId === employee.id) return { message: "An employee cannot report to themselves." };
  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
  const finalRole = employee.role === "super_admin" ? "super_admin" : data.role;
  const authAdmin = createAdminClient();
  let authUserId = employee.auth_user_id;
  let createdAuthUserId: string | null = null;
  if (authUserId) {
    const authUpdate = {
      email: data.officialEmail,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { company_id: admin.company_id, role: finalRole },
      ...(manageLogin && data.temporaryPassword ? { password: data.temporaryPassword } : {}),
    };
    const { error: authError } = await authAdmin.auth.admin.updateUserById(authUserId, authUpdate);
    if (authError) return { message: "The employee login account could not be updated. The official email may already be in use." };
  } else if (manageLogin && data.temporaryPassword) {
    const { data: authResult, error: authError } = await authAdmin.auth.admin.createUser({
      email: data.officialEmail,
      password: data.temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { company_id: admin.company_id, role: finalRole },
    });
    if (authError || !authResult.user) return { message: authError?.message?.toLowerCase().includes("already") ? "A login account with this official email already exists." : "The employee login account could not be created." };
    authUserId = authResult.user.id;
    createdAuthUserId = authResult.user.id;
  }
  const currentAddress = { line1: data.currentAddressLine1, line2: data.currentAddressLine2, city: data.currentCity, state: data.currentState, pinCode: data.currentPinCode, country: "India" };
  const permanentAddress = data.permanentSameAsCurrent ? currentAddress : { line1: data.permanentAddressLine1, city: data.permanentCity, state: data.permanentState, pinCode: data.permanentPinCode, country: "India" };
  const { error } = await supabase.from("users").update({
    full_name: fullName, first_name: data.firstName, middle_name: data.middleName, last_name: data.lastName,
    employee_code: data.employeeCode, email: data.officialEmail, personal_email: data.personalEmail,
    mobile_number: data.mobileNumber, alternate_mobile_number: data.alternateMobileNumber,
    date_of_birth: data.dateOfBirth, gender: data.gender, marital_status: data.maritalStatus, blood_group: data.bloodGroup,
    date_of_joining: data.dateOfJoining, employment_type: data.employmentType, employment_status: data.employmentStatus,
    probation_months: data.probationMonths ?? null, confirmation_date: data.confirmationDate,
    work_mode: data.workMode, work_location: data.workLocation, shift_name: data.shiftName,
    weekly_off_policy: data.weeklyOffPolicy, notice_period_days: data.noticePeriodDays ?? null,
    official_mobile_number: data.officialMobileNumber, department_id: data.departmentId, designation_id: data.designationId,
    reporting_manager_id: data.reportingManagerId, secondary_manager_id: data.secondaryManagerId,
    team_name: data.teamName, cost_centre: data.costCentre, grade: data.grade, employee_level: data.employeeLevel,
    current_address: currentAddress, permanent_address: permanentAddress,
    emergency_contact: { name: data.emergencyContactName, relationship: data.emergencyRelationship, mobile: data.emergencyMobile },
    bank_details: { accountHolderName: data.accountHolderName, bankName: data.bankName, accountNumber: data.accountNumber, ifscCode: data.ifscCode },
    statutory_details: { panNumber: data.panNumber, aadhaarNumber: data.aadhaarNumber, uanNumber: data.uanNumber, esiNumber: data.esiNumber, taxRegime: data.taxRegime },
    profile_completion: calculateCompletion(data),
    role: finalRole,
    auth_user_id: authUserId,
    status: authUserId ? "active" : undefined,
  }).eq("id", employee.id).eq("company_id", admin.company_id);
  if (error) {
    if (createdAuthUserId) await authAdmin.auth.admin.deleteUser(createdAuthUserId);
    return { message: employeeCreateErrorMessage(error) };
  }
  await supabase.from("audit_logs").insert({
    company_id: admin.company_id, actor_user_id: admin.id, entity_type: "employee",
    entity_id: employee.id, action: "updated",
    changes: { previous: { fullName: employee.full_name, email: employee.email, employeeCode: employee.employee_code }, loginAccount: manageLogin ? (createdAuthUserId ? "created" : "password_reset") : "unchanged" },
  });
  if (manageLogin && data.sendWelcomeEmail && authUserId) {
    const siteUrl = await getSiteUrl();
    await sendEmail({
      to: data.officialEmail,
      subject: createdAuthUserId ? "Your HRMS login account is ready" : "Your HRMS login password was reset",
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px"><h2>${createdAuthUserId ? "Your HRMS account is ready" : "Your HRMS password was reset"}</h2><p>Hi ${escapeHtml(fullName)},</p><p>Your login ID is <strong>${escapeHtml(data.officialEmail)}</strong>. Use the temporary password shared securely by your administrator.</p><p><a href="${siteUrl}/login">Sign in to HRMS</a></p><p style="font-size:12px;color:#777">For security, passwords are never included in email.</p></div>`,
    });
  }
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employee.id}`);
  revalidatePath(`/admin/employees/${employee.id}/edit`);
  redirect(`/admin/employees/${employee.id}`);
}
