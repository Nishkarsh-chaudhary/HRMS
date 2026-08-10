import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUserRow } from "@/lib/auth/dal";
import type { EmployeeAttendanceDay, EmployeeAttendanceSummary, EmployeeRequestView } from "@/components/attendance/employee-attendance-workspace";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

export async function getEmployeeAttendanceData(employee: CurrentUserRow) {
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("timezone").eq("id", employee.company_id).single();
  const companyTimezone = company?.timezone ?? "Asia/Kolkata";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: companyTimezone }).format(new Date());
  const monthStart = `${today.slice(0,7)}-01`;
  const monthEnd = `${today.slice(0,7)}-${new Date(Number(today.slice(0,4)), Number(today.slice(5,7)), 0).getDate().toString().padStart(2,"0")}`;
  const [{ data: records }, { data: requests }, { data: assignment }] = await Promise.all([
    supabase.from("attendance_records").select("attendance_date,first_check_in,last_check_out,gross_minutes,break_minutes,effective_minutes,overtime_minutes,late_minutes,early_minutes,status,source").eq("company_id", employee.company_id).eq("employee_id", employee.id).gte("attendance_date", monthStart).lte("attendance_date", monthEnd).order("attendance_date"),
    supabase.from("attendance_regularizations").select("request_type,attendance_date,requested_check_in,requested_check_out,status").eq("company_id", employee.company_id).eq("employee_id", employee.id).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("attendance_shift_assignments").select("shift_id").eq("company_id", employee.company_id).eq("employee_id", employee.id).lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { data: shift } = assignment ? await supabase.from("attendance_shifts").select("name,start_time,end_time,timezone").eq("id", assignment.shift_id).eq("company_id", employee.company_id).maybeSingle() : { data: null };
  const displayTimezone = shift?.timezone ?? companyTimezone;
  const formatTime = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", timeZone: displayTimezone }) : "—";
  const calendarRecords: EmployeeAttendanceDay[] = (records ?? []).map((record) => ({ day: Number(record.attendance_date.slice(-2)), status: label(record.status), checkIn: formatTime(record.first_check_in), checkOut: formatTime(record.last_check_out), grossMinutes: record.gross_minutes, breakMinutes: record.break_minutes, minutes: record.effective_minutes, overtimeMinutes: record.overtime_minutes, lateMinutes: record.late_minutes, earlyMinutes: record.early_minutes, source: label(record.source) }));
  const requestViews: EmployeeRequestView[] = (requests ?? []).map((request) => ({ type: label(request.request_type), date: new Date(`${request.attendance_date}T00:00:00`).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }), requested: request.requested_check_out ? formatTime(request.requested_check_out) : request.requested_check_in ? formatTime(request.requested_check_in) : "—", status: label(request.status) }));
  const summary: EmployeeAttendanceSummary = { present: (records ?? []).filter((record) => ["present","work_from_home","field_work"].includes(record.status)).length, minutes: (records ?? []).reduce((total, record) => total + record.effective_minutes, 0), late: (records ?? []).filter((record) => record.late_minutes > 0).length, pending: (requests ?? []).filter((request) => ["submitted","pending_manager","pending_hr"].includes(request.status)).length };
  const todayRecord = (records ?? []).find((record) => record.attendance_date === today);
  return { employeeName: employee.full_name, shiftName: shift?.name ?? employee.shift_name ?? "Not assigned", shiftTiming: shift ? `${shift.start_time.slice(0,5)} – ${shift.end_time.slice(0,5)}` : "No schedule configured", timezone: displayTimezone, initialCheckedIn: Boolean(todayRecord?.first_check_in && !todayRecord.last_check_out), calendarRecords, initialRequests: requestViews, summary };
}
