"use client";

import { useActionState } from "react";
import { Building2, Save } from "lucide-react";
import { updateCompanyProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeDatabase } from "@/lib/employee-database";

type Company = EmployeeDatabase["public"]["Tables"]["companies"]["Row"];
const asLines = (value: Company["core_values"]) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("\n") : "";

function Field({ label, name, value, type = "text", placeholder, disabled }: { label: string; name: keyof Company; value: string | number | null; type?: string; placeholder?: string; disabled: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} defaultValue={value ?? ""} placeholder={placeholder} disabled={disabled} /></div>;
}
function Area({ label, name, value, hint, disabled, rows = 4 }: { label: string; name: keyof Company; value: string | null; hint?: string; disabled: boolean; rows?: number }) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={value ?? ""} rows={rows} disabled={disabled} /><p className="text-xs text-muted-foreground">{hint}</p></div>;
}

export function CompanyProfileForm({ company, canEdit }: { company: Company; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateCompanyProfile, undefined);
  const disabled = !canEdit || pending;
  return <form action={action} className="space-y-6">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5" />Company identity</CardTitle><CardDescription>The registered company name, industry, size, and timezone remain managed by the existing company setup.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="Display name" name="name" value={company.name} disabled={true} />
      <Field label="Legal name" name="legal_name" value={company.legal_name} disabled={disabled} />
      <Field label="Tagline" name="tagline" value={company.tagline} disabled={disabled} />
      <Field label="Founded year" name="founded_year" value={company.founded_year} type="number" disabled={disabled} />
      <Field label="Headquarters" name="headquarters" value={company.headquarters} disabled={disabled} />
      <Field label="Company type" name="company_type" value={company.company_type} placeholder="Private, public, partnership…" disabled={disabled} />
      <Field label="Markets served" name="markets_served" value={company.markets_served} disabled={disabled} />
      <Field label="Website" name="website" value={company.website} type="url" placeholder="https://example.com" disabled={disabled} />
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Company narrative</CardTitle><CardDescription>Describe the company’s background, direction, and purpose.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">
      <Area label="Overview" name="overview" value={company.overview} disabled={disabled} />
      <Area label="Our story" name="story" value={company.story} disabled={disabled} />
      <Area label="Vision" name="vision" value={company.vision} disabled={disabled} />
      <Area label="Mission" name="mission" value={company.mission} disabled={disabled} />
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Capabilities and proof</CardTitle><CardDescription>For list fields, enter one item per line.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">
      <Area label="Core values" name="core_values" value={asLines(company.core_values)} hint="One value per line." disabled={disabled} />
      <Area label="Products and services" name="offerings" value={asLines(company.offerings)} hint="One offering per line." disabled={disabled} />
      <Area label="What sets us apart" name="differentiators" value={asLines(company.differentiators)} hint="One differentiator per line." disabled={disabled} />
      <Area label="Track record" name="track_record" value={asLines(company.track_record)} hint="One milestone, metric, or result per line." disabled={disabled} />
      <Area label="Industries and customers" name="industries_customers" value={company.industries_customers} disabled={disabled} />
      <Area label="Certifications and awards" name="certifications_awards" value={company.certifications_awards} disabled={disabled} />
      <Area label="Leadership" name="leadership" value={asLines(company.leadership)} hint="One leader per line, for example: Name — Title — Short biography." disabled={disabled} />
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Contact details</CardTitle><CardDescription>Official ways for employees and stakeholders to reach the company.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Area label="Office address" name="office_address" value={company.office_address} disabled={disabled} rows={3} />
      <Area label="Social links" name="social_links" value={company.social_links} hint="Add one link per line." disabled={disabled} rows={3} />
      <Field label="Phone" name="phone" value={company.phone} type="tel" disabled={disabled} />
      <Field label="Contact email" name="contact_email" value={company.contact_email} type="email" disabled={disabled} />
    </CardContent></Card>

    {state && <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-destructive"}`}>{state.message}</p>}
    <div className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{canEdit ? "Saving this form does not modify company identity or operational module settings." : "Only Super Admins and HR Admins can edit this profile."}</p>{canEdit && <Button type="submit" disabled={pending}><Save />{pending ? "Saving…" : "Save company profile"}</Button>}</div>
  </form>;
}
