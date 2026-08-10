import { redirect } from "next/navigation";
import ComingSoon from "@/components/coming-soon";
import { requirePortal } from "@/lib/auth/dal";

export default async function SelfServiceTeamPage() {
  const profile = await requirePortal();
  if (profile.role !== "manager") redirect("/portal");

  return <ComingSoon title="My Team" description="Team attendance, leave approvals, and reportee details." />;
}
