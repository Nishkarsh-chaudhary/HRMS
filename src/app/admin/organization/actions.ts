"use server";

import { revalidatePath } from "next/cache";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/organization";

export async function createOrganisationNode(formData: FormData) {
  const admin = await requireUserAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nodeType = String(formData.get("nodeType") ?? "department");
  if (name.length < 2 || !/^[A-Z0-9_-]{2,20}$/.test(code)) return;
  const { data } = await supabase.from("organisation_nodes").insert({
    company_id: admin.company_id, name, code, node_type: nodeType,
    parent_id: String(formData.get("parentId") ?? "") || null,
    head_user_id: String(formData.get("headUserId") ?? "") || null,
    description: String(formData.get("description") ?? "").trim() || null,
    created_by: admin.id,
  }).select("id").single();
  if (data) await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "organisation_node", entity_id: data.id, action: "created", changes: { name, code, nodeType } });
  revalidatePath(path);
}

export type CreateDesignationState = { ok: boolean; message: string } | undefined;

export async function createDesignation(
  _previousState: CreateDesignationState,
  formData: FormData,
): Promise<CreateDesignationState> {
  const admin = await requireUserAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const level = Number(formData.get("level") ?? 1);
  const parentId = String(formData.get("parentId") ?? "") || null;
  if (name.length < 2) return { ok: false, message: "Designation name must contain at least 2 characters." };
  if (!/^[A-Z0-9_-]{2,20}$/.test(code)) return { ok: false, message: "Code must be 2–20 characters and use only letters, numbers, hyphens, or underscores." };
  if (!Number.isInteger(level) || level < 1 || level > 20) return { ok: false, message: "Level must be a whole number from 1 to 20." };
  if (parentId) {
    const { data: parent } = await supabase.from("designations").select("id").eq("id", parentId).eq("company_id", admin.company_id).maybeSingle();
    if (!parent) return { ok: false, message: "The selected parent designation is no longer available." };
  }
  const { data, error } = await supabase.from("designations").insert({ company_id: admin.company_id, name, code, level, parent_id: parentId }).select("id").single();
  if (error) {
    const duplicate = error.code === "23505";
    return { ok: false, message: duplicate ? "A designation with this name or code already exists." : "Designation could not be created. Please try again." };
  }
  await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "designation", entity_id: data.id, action: "created", changes: { name, code, level, parentId } });
  revalidatePath(path);
  return { ok: true, message: `${name} was created.` };
}

export async function mapEmployee(formData: FormData) {
  const admin = await requireUserAdmin();
  const supabase = await createClient();
  const employeeId = String(formData.get("employeeId") ?? "");
  if (!employeeId) return;
  await supabase.from("users").update({
    organisation_node_id: String(formData.get("nodeId") ?? "") || null,
    designation_id: String(formData.get("designationId") ?? "") || null,
    reporting_manager_id: String(formData.get("managerId") ?? "") || null,
    secondary_manager_id: String(formData.get("secondaryManagerId") ?? "") || null,
    cost_centre: String(formData.get("costCentre") ?? "").trim() || null,
    grade: String(formData.get("grade") ?? "").trim() || null,
    employee_level: String(formData.get("level") ?? "").trim() || null,
  }).eq("id", employeeId).eq("company_id", admin.company_id);
  await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "employee_mapping", entity_id: employeeId, action: "updated", changes: { organisation: String(formData.get("nodeId") ?? ""), designation: String(formData.get("designationId") ?? "") } });
  revalidatePath(path);
}

export async function moveOrganisationNode(nodeId: string, parentId: string) {
  const admin = await requireUserAdmin();
  if (!nodeId || nodeId === parentId) return { ok: false };
  const supabase = await createClient();
  const { data: target } = await supabase.from("organisation_nodes").select("id").eq("id", parentId).eq("company_id", admin.company_id).maybeSingle();
  if (!target) return { ok: false };
  const { error } = await supabase.from("organisation_nodes").update({ parent_id: parentId }).eq("id", nodeId).eq("company_id", admin.company_id);
  if (error) return { ok: false };
  await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "organisation_node", entity_id: nodeId, action: "moved", changes: { parentId } });
  revalidatePath(path);
  return { ok: true };
}

export async function deleteOrganisationNode(nodeId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireUserAdmin();
  if (admin.role !== "super_admin") return { ok: false, message: "Only a Super Admin can delete organisation nodes." };
  if (!nodeId) return { ok: false, message: "Organisation node was not found." };

  const supabase = await createClient();
  const { data: node } = await supabase
    .from("organisation_nodes")
    .select("id, name, code, node_type")
    .eq("id", nodeId)
    .eq("company_id", admin.company_id)
    .maybeSingle();
  if (!node) return { ok: false, message: "Organisation node was not found." };

  const [{ count: employeeCount }, { count: childCount }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("company_id", admin.company_id).eq("organisation_node_id", node.id),
    supabase.from("organisation_nodes").select("id", { count: "exact", head: true }).eq("company_id", admin.company_id).eq("parent_id", node.id),
  ]);
  if (employeeCount) return { ok: false, message: `Cannot delete ${node.name} because it has ${employeeCount} assigned employee${employeeCount === 1 ? "" : "s"}. Reassign them first.` };
  if (childCount) return { ok: false, message: `Cannot delete ${node.name} because it has ${childCount} child node${childCount === 1 ? "" : "s"}. Move or delete them first.` };

  const { error } = await supabase.from("organisation_nodes").delete().eq("id", node.id).eq("company_id", admin.company_id);
  if (error) return { ok: false, message: "Organisation node could not be deleted." };

  await supabase.from("audit_logs").insert({
    company_id: admin.company_id,
    actor_user_id: admin.id,
    entity_type: "organisation_node",
    entity_id: node.id,
    action: "deleted",
    changes: { name: node.name, code: node.code, nodeType: node.node_type },
  });
  revalidatePath(path);
  return { ok: true, message: `${node.name} was deleted.` };
}

export async function deleteDesignation(designationId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireUserAdmin();
  if (admin.role !== "super_admin") return { ok: false, message: "Only a Super Admin can delete designations." };
  if (!designationId) return { ok: false, message: "Designation was not found." };
  const supabase = await createClient();
  const { data: designation } = await supabase.from("designations").select("id, name").eq("id", designationId).eq("company_id", admin.company_id).maybeSingle();
  if (!designation) return { ok: false, message: "Designation was not found." };
  const [{ count: employeeCount }, { count: childCount }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("company_id", admin.company_id).eq("designation_id", designation.id),
    supabase.from("designations").select("id", { count: "exact", head: true }).eq("company_id", admin.company_id).eq("parent_id", designation.id),
  ]);
  if (employeeCount) return { ok: false, message: `Cannot delete ${designation.name} because it is assigned to ${employeeCount} employee${employeeCount === 1 ? "" : "s"}.` };
  if (childCount) return { ok: false, message: `Cannot delete ${designation.name} because ${childCount} designation${childCount === 1 ? "" : "s"} report to it.` };
  const { error } = await supabase.from("designations").delete().eq("id", designation.id).eq("company_id", admin.company_id);
  if (error) return { ok: false, message: "Designation could not be deleted." };
  await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "designation", entity_id: designation.id, action: "deleted", changes: { name: designation.name } });
  revalidatePath(path);
  return { ok: true, message: `${designation.name} was deleted.` };
}
