import { EmployeeAttendanceWorkspace } from "@/components/attendance/employee-attendance-workspace";
import { requirePortal } from "@/lib/auth/dal";
import { getEmployeeAttendanceData } from "@/lib/attendance/data";

export default async function SelfServiceAttendancePage() {
  const employee = await requirePortal();
  return <EmployeeAttendanceWorkspace {...await getEmployeeAttendanceData(employee)} />;
}
