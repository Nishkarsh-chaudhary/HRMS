import { AdminLeaveWorkspace } from "@/components/leave/admin-leave-workspace";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminLeaveData } from "@/lib/leave/data";

export default async function AdminLeavePage({searchParams}:{searchParams:Promise<{tab?:string}>}) {
  const profile=await requireAdmin();
  const {tab}=await searchParams;
  return <AdminLeaveWorkspace {...await getAdminLeaveData(profile)} activeTab={tab==="calendar"?"calendar":"overview"}/>;
}
