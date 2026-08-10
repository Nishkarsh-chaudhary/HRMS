"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type AttendanceActionResult = { ok: boolean; message: string };

const ManualAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.string().date(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  status: z.enum(["present","absent","half_day","on_leave","work_from_home","field_work"]),
  reason: z.string().trim().min(3).max(500),
});

const RegularizationSchema = z.object({
  attendanceDate: z.string().date(),
  requestType: z.string().trim().min(3).max(100),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
  reason: z.string().trim().min(3).max(1000),
});

const OfficePolicySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(12).transform((value) => value.toUpperCase()),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(3).max(80),
  graceMinutes: z.number().int().min(0).max(240),
  fullDayMinutes: z.number().int().min(1).max(1440),
  halfDayMinutes: z.number().int().min(1).max(1440),
  breakMinutes: z.number().int().min(0).max(480),
  breakMode: z.enum(["fixed", "punches"]),
  overtimeMethod: z.enum(["effective_hours", "after_shift_end"]),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().nullable().optional(),
  overnight: z.boolean(),
  weeklyOffs: z.array(z.number().int().min(0).max(6)).min(1),
  location: z.string().trim().max(100).nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
}).refine((value) => value.halfDayMinutes < value.fullDayMinutes, { message: "Half-day hours must be lower than full-day hours." })
  .refine((value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom, { message: "Effective end date must be after the start date." });

export type OfficePolicyInput = z.input<typeof OfficePolicySchema>;

function localTimestamp(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

function refreshAttendance() {
  revalidatePath("/admin/attendance");
  revalidatePath("/employee/attendance");
  revalidatePath("/self-service/attendance");
}

export async function addManualAttendance(input: z.infer<typeof ManualAttendanceSchema>): Promise<AttendanceActionResult> {
  const admin = await requireAdmin();
  if (!['super_admin','hr_admin'].includes(admin.role)) return { ok: false, message: "You do not have permission to edit attendance." };
  const parsed = ManualAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid attendance details." };
  const supabase = await createClient();
  const { data: employee } = await supabase.from("users").select("id").eq("id", parsed.data.employeeId).eq("company_id", admin.company_id).maybeSingle();
  if (!employee) return { ok: false, message: "Employee not found in your company." };
  const first = localTimestamp(parsed.data.attendanceDate, parsed.data.checkIn);
  const last = localTimestamp(parsed.data.attendanceDate, parsed.data.checkOut);
  if (new Date(last) < new Date(first)) return { ok: false, message: "Check-out cannot be earlier than check-in." };
  const effective = Math.max(0, Math.round((new Date(last).getTime() - new Date(first).getTime()) / 60000));
  const { data, error } = await supabase.from("attendance_records").upsert({
    company_id: admin.company_id, employee_id: employee.id, attendance_date: parsed.data.attendanceDate,
    first_check_in: first, last_check_out: last, effective_minutes: effective,
    status: parsed.data.status, source: "manual", notes: parsed.data.reason, created_by: admin.id,
  }, { onConflict: "company_id,employee_id,attendance_date" }).select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Attendance could not be saved." };
  const { error: calculationError } = await supabase.rpc("recalculate_attendance_record", { p_record_id: data.id });
  if (calculationError) return { ok: false, message: calculationError.message };
  await supabase.from("attendance_audit_events").insert({ company_id: admin.company_id, employee_id: employee.id, actor_user_id: admin.id, attendance_record_id: data.id, action: "manual_attendance_saved", source: "manual", reason: parsed.data.reason, new_value: parsed.data });
  refreshAttendance();
  return { ok: true, message: "Manual attendance saved." };
}

export async function reviewRegularization(id: string, decision: "approved" | "rejected", comment = ""): Promise<AttendanceActionResult> {
  const reviewer = await requireProfile();
  if (!['super_admin','hr_admin','manager'].includes(reviewer.role)) return { ok: false, message: "You cannot review requests." };
  const supabase = await createClient();
  const { data: request } = await supabase.from("attendance_regularizations").select("*").eq("id", id).eq("company_id", reviewer.company_id).maybeSingle();
  if (!request) return { ok: false, message: "Request not found or no longer accessible." };
  if (reviewer.role === 'manager' && request.manager_id !== reviewer.id) return { ok: false, message: "This request is not assigned to you." };
  const { error } = await supabase.from("attendance_regularizations").update({ status: decision, reviewed_by: reviewer.id, reviewer_comment: comment || null, reviewed_at: new Date().toISOString() }).eq("id", request.id).eq("company_id", reviewer.company_id);
  if (error) return { ok: false, message: error.message };
  if (decision === "approved") {
    const updates = {
      source: "regularization",
      first_check_in: request.requested_check_in ?? undefined,
      last_check_out: request.requested_check_out ?? undefined,
      effective_minutes: request.requested_check_in && request.requested_check_out
        ? Math.max(0, Math.round((new Date(request.requested_check_out).getTime() - new Date(request.requested_check_in).getTime()) / 60000))
        : undefined,
    };
    await supabase.from("attendance_records").update(updates).eq("company_id", reviewer.company_id).eq("employee_id", request.employee_id).eq("attendance_date", request.attendance_date).eq("locked", false);
  }
  await supabase.from("attendance_audit_events").insert({ company_id: reviewer.company_id, employee_id: request.employee_id, actor_user_id: reviewer.id, attendance_record_id: request.attendance_record_id, action: `regularization_${decision}`, source: "regularization", reason: comment || null, new_value: { request_id: request.id, decision } });
  refreshAttendance();
  return { ok: true, message: `Request ${decision}.` };
}

export async function toggleAttendanceMonthLock(periodStart: string, periodEnd: string): Promise<AttendanceActionResult> {
  const admin = await requireAdmin();
  if (!['super_admin','hr_admin'].includes(admin.role)) return { ok: false, message: "You cannot lock attendance." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("attendance_period_locks").select("id").eq("company_id", admin.company_id).eq("period_start", periodStart).eq("period_end", periodEnd).eq("active", true).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("attendance_period_locks").update({ active: false, unlocked_by: admin.id, unlocked_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
    await supabase.from("attendance_records").update({ locked: false }).eq("company_id", admin.company_id).gte("attendance_date", periodStart).lte("attendance_date", periodEnd);
  } else {
    const { error } = await supabase.from("attendance_period_locks").insert({ company_id: admin.company_id, period_start: periodStart, period_end: periodEnd, locked_by: admin.id });
    if (error) return { ok: false, message: error.message };
    await supabase.from("attendance_records").update({ locked: true }).eq("company_id", admin.company_id).gte("attendance_date", periodStart).lte("attendance_date", periodEnd);
  }
  refreshAttendance();
  return { ok: true, message: existing ? "Attendance month unlocked." : "Attendance month locked." };
}

export async function submitRegularization(input: z.infer<typeof RegularizationSchema>): Promise<AttendanceActionResult> {
  const employee = await requireProfile();
  const parsed = RegularizationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." };
  const supabase = await createClient();
  const { data: lock } = await supabase.from("attendance_period_locks").select("id").eq("company_id", employee.company_id).eq("active", true).lte("period_start", parsed.data.attendanceDate).gte("period_end", parsed.data.attendanceDate).maybeSingle();
  if (lock) return { ok: false, message: "Attendance for this period is locked." };
  const requestedCheckIn = parsed.data.requestedCheckIn ? localTimestamp(parsed.data.attendanceDate, parsed.data.requestedCheckIn) : null;
  const requestedCheckOut = parsed.data.requestedCheckOut ? localTimestamp(parsed.data.attendanceDate, parsed.data.requestedCheckOut) : null;
  const { error } = await supabase.from("attendance_regularizations").insert({ company_id: employee.company_id, employee_id: employee.id, attendance_date: parsed.data.attendanceDate, request_type: parsed.data.requestType, requested_check_in: requestedCheckIn, requested_check_out: requestedCheckOut, reason: parsed.data.reason, manager_id: employee.reporting_manager_id, status: employee.reporting_manager_id ? "pending_manager" : "pending_hr" });
  if (error) return { ok: false, message: error.code === "23505" ? "An open request already exists for this date." : error.message };
  refreshAttendance();
  return { ok: true, message: "Regularization request submitted." };
}

export async function punchAttendance(type: "in" | "out"): Promise<AttendanceActionResult> {
  await requireProfile();
  const requestHeaders = await headers();
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";
  const observedIp = trustProxy ? (requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip")) : null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_attendance_punch", { p_type: type, p_observed_ip: observedIp, p_user_agent: requestHeaders.get("user-agent") });
  if (error) return { ok: false, message: error.message };
  refreshAttendance();
  return { ok: true, message: type === "in" ? "Checked in successfully." : "Checked out successfully." };
}

export async function saveOfficePolicy(input: OfficePolicyInput): Promise<AttendanceActionResult> {
  const admin = await requireAdmin();
  if (!["super_admin", "hr_admin"].includes(admin.role)) return { ok: false, message: "You cannot manage office timing policies." };
  const parsed = OfficePolicySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid policy." };
  const supabase = await createClient();
  const policy = parsed.data;
  const values = {
    company_id: admin.company_id,
    name: policy.name,
    code: policy.code,
    start_time: policy.startTime,
    end_time: policy.endTime,
    timezone: policy.timezone,
    grace_minutes: policy.graceMinutes,
    full_day_minutes: policy.fullDayMinutes,
    half_day_minutes: policy.halfDayMinutes,
    break_minutes: policy.breakMinutes,
    break_mode: policy.breakMode,
    overtime_method: policy.overtimeMethod,
    effective_from: policy.effectiveFrom,
    effective_to: policy.effectiveTo || null,
    overnight: policy.overnight || policy.endTime <= policy.startTime,
    weekly_offs: policy.weeklyOffs,
    location: policy.location || null,
    department_id: policy.departmentId || null,
    active: true,
  };
  const query = policy.id
    ? supabase.from("attendance_shifts").update(values).eq("id", policy.id).eq("company_id", admin.company_id)
    : supabase.from("attendance_shifts").insert(values);
  const { data, error } = await query.select("id").single();
  if (error || !data) return { ok: false, message: error?.code === "23505" ? "That policy code is already in use." : error?.message ?? "Policy could not be saved." };
  await supabase.from("attendance_audit_events").insert({
    company_id: admin.company_id,
    actor_user_id: admin.id,
    action: policy.id ? "office_policy_updated" : "office_policy_created",
    source: "manual",
    new_value: values,
  });
  const { data: affectedRecords } = await supabase.from("attendance_records").select("id")
    .eq("company_id", admin.company_id).eq("locked", false)
    .gte("attendance_date", policy.effectiveFrom)
    .lte("attendance_date", policy.effectiveTo || "9999-12-31");
  for (const record of affectedRecords ?? []) await supabase.rpc("recalculate_attendance_record", { p_record_id: record.id });
  refreshAttendance();
  return { ok: true, message: policy.id ? "Office timing policy updated." : "Office timing policy created." };
}
