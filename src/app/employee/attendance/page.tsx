import { EmployeeAttendanceWorkspace } from "@/components/attendance/employee-attendance-workspace";
import { requireEmployee } from "@/lib/auth/dal";
import { getEmployeeAttendanceData } from "@/lib/attendance/data";

export default async function EmployeeAttendancePage() {
  const employee = await requireEmployee();
  return <EmployeeAttendanceWorkspace {...await getEmployeeAttendanceData(employee)} />;
}
