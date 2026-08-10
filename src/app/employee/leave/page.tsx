import { EmployeeLeaveWorkspace } from "@/components/leave/employee-leave-workspace";
import { requireEmployee } from "@/lib/auth/dal";
import { getEmployeeLeaveData } from "@/lib/leave/data";

export default async function EmployeeLeavePage() {
  const profile=await requireEmployee();
  return <EmployeeLeaveWorkspace {...await getEmployeeLeaveData(profile)}/>;
}
