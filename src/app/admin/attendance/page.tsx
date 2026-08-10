import { AdminAttendanceWorkspace, type AttendanceKpis, type AttendanceListRow, type AttendanceMatrixRow, type AttendanceRequestRow, type AttendanceShiftView } from "@/components/attendance/admin-attendance-workspace";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const attendanceTabs = new Set(["overview", "daily", "monthly", "regularization", "shifts", "reports"]);
const statusLabel = (status: string) => status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const statusCode: Record<string,string> = { present:"P", absent:"A", half_day:"HD", on_leave:"L", holiday:"H", weekly_off:"WO", work_from_home:"WFH", field_work:"FD", missing_check_in:"MP", missing_check_out:"MP" };

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ tab?: string; month?: string }> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const requestedTab = params.tab ?? "overview";
  const initialTab = attendanceTabs.has(requestedTab) ? requestedTab : "overview";
  const supabase = await createClient();
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  const selectedMonth = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : today.slice(0,7);
  const monthStart = `${selectedMonth}-01`;
  const monthEnd = `${selectedMonth}-${new Date(Number(selectedMonth.slice(0,4)), Number(selectedMonth.slice(5,7)), 0).getDate().toString().padStart(2,"0")}`;
  const [{ data: monthRecords }, { data: employees }, { data: departments }, { data: requestData }, { data: shifts }, { data: assignments }, { data: activeLock }, { data: company }] = await Promise.all([
    supabase.from("attendance_records").select("employee_id,shift_id,attendance_date,first_check_in,last_check_out,gross_minutes,break_minutes,effective_minutes,overtime_minutes,status,late_minutes").eq("company_id", admin.company_id).gte("attendance_date", monthStart).lte("attendance_date", monthEnd),
    supabase.from("users").select("id,full_name,employee_code,department_id,shift_name,work_location,employment_status").eq("company_id", admin.company_id).neq("employment_status", "archived").order("full_name"),
    supabase.from("departments").select("id,name").eq("company_id", admin.company_id),
    supabase.from("attendance_regularizations").select("id,employee_id,attendance_date,request_type,requested_check_in,requested_check_out,submitted_at,status").eq("company_id", admin.company_id).order("submitted_at", { ascending: false }).limit(50),
    supabase.from("attendance_shifts").select("id,name,code,start_time,end_time,timezone,grace_minutes,full_day_minutes,half_day_minutes,break_minutes,break_mode,overtime_method,effective_from,effective_to,overnight,weekly_offs,location,department_id").eq("company_id", admin.company_id).eq("active", true).order("name"),
    supabase.from("attendance_shift_assignments").select("employee_id,shift_id").eq("company_id", admin.company_id).lte("effective_from", monthEnd).or(`effective_to.is.null,effective_to.gte.${monthStart}`),
    supabase.from("attendance_period_locks").select("id").eq("company_id", admin.company_id).eq("period_start", monthStart).eq("period_end", monthEnd).eq("active", true).maybeSingle(),
    supabase.from("companies").select("timezone").eq("id", admin.company_id).single(),
  ]);
  const employeeRows = employees ?? [];
  const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee]));
  const departmentMap = new Map((departments ?? []).map((department) => [department.id, department.name]));
  const todayMap = new Map((monthRecords ?? []).filter((record) => record.attendance_date === today).map((record) => [record.employee_id, record]));
  const formatTime = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const initialRecords: AttendanceListRow[] = employeeRows.map((employee) => {
    const record = todayMap.get(employee.id);
    const liveStatus = record?.first_check_in ? "Present" : "Absent";
    return { name: employee.full_name, id: employee.employee_code ?? employee.id.slice(0,8), dept: employee.department_id ? departmentMap.get(employee.department_id) ?? "Unassigned" : "Unassigned", shift: employee.shift_name ?? "Not assigned", in: formatTime(record?.first_check_in ?? null), out: formatTime(record?.last_check_out ?? null), hours: record ? (record.last_check_out ? `${Math.floor(record.effective_minutes / 60)}h ${record.effective_minutes % 60}m` : record.first_check_in ? "In progress" : "—") : "—", status: liveStatus, late: record?.late_minutes ? `${record.late_minutes}m` : "—", avatar: employee.full_name.split(" ").map((part) => part[0]).join("").slice(0,2).toUpperCase() };
  });
  const days = Array.from({ length: Number(monthEnd.slice(-2)) }, (_, index) => `${selectedMonth}-${String(index + 1).padStart(2,"0")}`);
  const recordLookup = new Map((monthRecords ?? []).map((record) => [`${record.employee_id}:${record.attendance_date}`, record]));
  const shiftMap = new Map((shifts ?? []).map((shift) => [shift.id, shift]));
  const employeeShiftMap = new Map((assignments ?? []).map((assignment) => [assignment.employee_id, assignment.shift_id]));
  const pendingByEmployee = new Map<string, number>();
  for (const request of requestData ?? []) if (["submitted","pending_manager","pending_hr"].includes(request.status)) pendingByEmployee.set(request.employee_id, (pendingByEmployee.get(request.employee_id) ?? 0) + 1);
  const matrixRows: AttendanceMatrixRow[] = employeeRows.map((employee) => {
    const employeeRecords = (monthRecords ?? []).filter((record) => record.employee_id === employee.id);
    const assignedShift = shiftMap.get(employeeShiftMap.get(employee.id) ?? "") ?? shiftMap.get(employeeRecords.find((record) => record.shift_id)?.shift_id ?? "");
    const daily = days.map((date) => { const record = recordLookup.get(`${employee.id}:${date}`); return { date, code: statusCode[record?.status ?? ""] ?? "—", status: record ? statusLabel(record.status) : "No record", checkIn: formatTime(record?.first_check_in ?? null), checkOut: formatTime(record?.last_check_out ?? null), lateMinutes: record?.late_minutes ?? 0, grossMinutes: record?.gross_minutes ?? 0, breakMinutes: record?.break_minutes ?? 0, effectiveMinutes: record?.effective_minutes ?? 0, overtimeMinutes: record?.overtime_minutes ?? 0, regularization: (requestData ?? []).some((request) => request.employee_id === employee.id && request.attendance_date === date && ["submitted","pending_manager","pending_hr"].includes(request.status)) ? "Pending" : "None" }; });
    return { employeeId: employee.id, employeeCode: employee.employee_code ?? employee.id.slice(0,8), name: employee.full_name, department: employee.department_id ? departmentMap.get(employee.department_id) ?? "Unassigned" : "Unassigned", location: employee.work_location ?? "Unassigned", shift: assignedShift?.name ?? employee.shift_name ?? "Not assigned", shiftTiming: assignedShift ? `${assignedShift.start_time.slice(0,5)} – ${assignedShift.end_time.slice(0,5)}` : "Not configured", days: daily, present: daily.filter((day) => day.code === "P").length, absent: daily.filter((day) => day.code === "A").length, leave: daily.filter((day) => day.code === "L").length, wfh: daily.filter((day) => day.code === "WFH").length, late: daily.filter((day) => day.lateMinutes > 0).length, grossMinutes: daily.reduce((sum, day) => sum + day.grossMinutes, 0), effectiveMinutes: daily.reduce((sum, day) => sum + day.effectiveMinutes, 0), overtimeMinutes: daily.reduce((sum, day) => sum + day.overtimeMinutes, 0), pendingRegularizations: pendingByEmployee.get(employee.id) ?? 0 };
  });
  const requestRows: AttendanceRequestRow[] = (requestData ?? []).map((request) => ({ id: request.id, name: employeeMap.get(request.employee_id)?.full_name ?? "Former employee", date: new Date(`${request.attendance_date}T00:00:00`).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }), type: statusLabel(request.request_type), requested: request.requested_check_out ? formatTime(request.requested_check_out) : request.requested_check_in ? formatTime(request.requested_check_in) : "—", submitted: new Date(request.submitted_at).toLocaleString("en-IN"), status: ["submitted","pending_manager","pending_hr"].includes(request.status) ? "Pending" : statusLabel(request.status) }));
  const assignmentCounts = new Map<string,number>();
  for (const assignment of assignments ?? []) assignmentCounts.set(assignment.shift_id, (assignmentCounts.get(assignment.shift_id) ?? 0) + 1);
  const shiftRows: AttendanceShiftView[] = (shifts ?? []).map((shift) => ({ id: shift.id, name: shift.name, code: shift.code, startTime: shift.start_time.slice(0,5), endTime: shift.end_time.slice(0,5), timezone: shift.timezone, graceMinutes: shift.grace_minutes, fullDayMinutes: shift.full_day_minutes, halfDayMinutes: shift.half_day_minutes, breakMinutes: shift.break_minutes, breakMode: shift.break_mode, overtimeMethod: shift.overtime_method, effectiveFrom: shift.effective_from, effectiveTo: shift.effective_to, overnight: shift.overnight, weeklyOffs: shift.weekly_offs, location: shift.location, departmentId: shift.department_id, assigned: assignmentCounts.get(shift.id) ?? 0 }));
  const attendanceKpis: AttendanceKpis = { total: employeeRows.length, present: initialRecords.filter((row) => ["Present","Work From Home","Field Work"].includes(row.status)).length, absent: initialRecords.filter((row) => row.status === "Absent").length, leave: initialRecords.filter((row) => row.status === "On Leave").length, late: initialRecords.filter((row) => row.late !== "—").length, remote: initialRecords.filter((row) => row.status === "Work From Home").length, missingCheckout: initialRecords.filter((row) => row.in !== "—" && row.out === "—").length, pendingRequests: requestRows.filter((row) => row.status.startsWith("Pending") || row.status === "Submitted").length };
  return <AdminAttendanceWorkspace initialRecords={initialRecords} matrixRows={matrixRows} requestRows={requestRows} shiftRows={shiftRows} departments={departments ?? []} companyTimezone={company?.timezone ?? "Asia/Kolkata"} selectedMonth={selectedMonth} today={today} initialLocked={Boolean(activeLock)} attendanceKpis={attendanceKpis} initialTab={initialTab} />;
}
