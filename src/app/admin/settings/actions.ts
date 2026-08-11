"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type CompanyProfileState = { ok: boolean; message: string } | undefined;
const optionalText = z.string().trim().max(5000).transform((value) => value || null);
const schema = z.object({
  tagline: optionalText, legal_name: optionalText,
  founded_year: z.string().trim().refine((value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 1800 && Number(value) <= 2200), "Enter a valid four-digit founding year."),
  headquarters: optionalText, company_type: optionalText, markets_served: optionalText,
  website: z.string().trim().max(500).refine((value) => !value || /^https?:\/\//i.test(value), "Website must begin with http:// or https://.").transform((value) => value || null),
  overview: optionalText, story: optionalText, vision: optionalText, mission: optionalText,
  industries_customers: optionalText, certifications_awards: optionalText, office_address: optionalText,
  phone: z.string().trim().max(50).transform((value) => value || null),
  contact_email: z.string().trim().max(320).refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid contact email.").transform((value) => value || null),
  social_links: optionalText,
  core_values: z.string().max(10000), offerings: z.string().max(10000), differentiators: z.string().max(10000), track_record: z.string().max(10000), leadership: z.string().max(10000),
});
const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export async function updateCompanyProfile(_state: CompanyProfileState, formData: FormData): Promise<CompanyProfileState> {
  const admin = await requireUserAdmin();
  const raw = Object.fromEntries(Array.from(formData.keys()).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the profile details and try again." };
  const { founded_year, core_values, offerings, differentiators, track_record, leadership, ...textFields } = parsed.data;
  const update = { ...textFields, founded_year: founded_year ? Number(founded_year) : null, core_values: lines(core_values), offerings: lines(offerings), differentiators: lines(differentiators), track_record: lines(track_record), leadership: lines(leadership) };
  const supabase = await createClient();
  const { error } = await supabase.from("companies").update(update).eq("id", admin.company_id);
  if (error) return { ok: false, message: "Company profile could not be saved. Apply the latest database migration and try again." };
  await supabase.from("audit_logs").insert({ company_id: admin.company_id, actor_user_id: admin.id, entity_type: "company_profile", entity_id: admin.company_id, action: "updated", changes: update });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Company profile saved." };
}
