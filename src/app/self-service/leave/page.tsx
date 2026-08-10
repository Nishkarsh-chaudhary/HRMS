import { EmployeeLeaveWorkspace } from "@/components/leave/employee-leave-workspace";
import { requirePortal } from "@/lib/auth/dal";
import { getEmployeeLeaveData } from "@/lib/leave/data";

export default async function SelfServiceLeavePage() {
  const profile=await requirePortal();
  return <EmployeeLeaveWorkspace {...await getEmployeeLeaveData(profile)}/>;
}
