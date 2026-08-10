import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { OrganisationWorkspace, type OrganisationTab } from "./organisation-workspace";

const validTabs = new Set<OrganisationTab>(["dashboard", "tree", "designations", "chart", "mapping", "logs"]);

export default async function OrganisationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const requestedTab = (await searchParams).tab;
  const initialTab: OrganisationTab = typeof requestedTab === "string" && validTabs.has(requestedTab as OrganisationTab)
    ? requestedTab as OrganisationTab
    : "dashboard";
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [companyResult, nodesResult, designationsResult, employeesResult, logsResult] = await Promise.all([
    supabase.from("companies").select("id, name").eq("id", admin.company_id).single(),
    supabase.from("organisation_nodes").select("*").eq("company_id", admin.company_id).order("sort_order").order("name"),
    supabase.from("designations").select("id, name, code, level, parent_id, status").eq("company_id", admin.company_id).order("level").order("name"),
    supabase.from("users").select("id, full_name, email, employee_code, employment_status, organisation_node_id, designation_id, reporting_manager_id, secondary_manager_id, cost_centre, grade, employee_level").eq("company_id", admin.company_id).order("full_name"),
    supabase.from("audit_logs").select("id, entity_type, action, changes, created_at, actor_user_id").eq("company_id", admin.company_id).in("entity_type", ["organisation_node", "designation", "employee_mapping"]).order("created_at", { ascending: false }).limit(100),
  ]);

  return <OrganisationWorkspace company={companyResult.data ?? { id: admin.company_id, name: "Company" }} nodes={nodesResult.data ?? []} designations={designationsResult.data ?? []} employees={employeesResult.data ?? []} logs={logsResult.data ?? []} canManage={admin.role === "super_admin" || admin.role === "hr_admin"} canDelete={admin.role === "super_admin"} initialTab={initialTab} />;
}
