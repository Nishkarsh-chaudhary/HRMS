import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/role-home";

async function activateUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, company_id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  if (profile.status === "invited") {
    await supabase.from("users").update({ status: "active" }).eq("id", profile.id);
  }
  if (profile.role === "super_admin" && profile.status === "invited") {
    const { data: company } = await supabase
      .from("companies")
      .select("id, status")
      .eq("id", profile.company_id)
      .maybeSingle();
    if (company && company.status !== "active") {
      await supabase.from("companies").update({ status: "active" }).eq("id", company.id);
    }
  }

  return profile;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();
  const redirectTarget = (next: string) =>
    new URL(next.startsWith("/") && !next.startsWith("//") ? next : roleHome("admin"), origin);

  // PKCE callback (legacy flow).
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const profile = await activateUser(supabase);
      return NextResponse.redirect(redirectTarget(profile ? roleHome(profile.role) : "/dashboard"));
    }
  }

  // Email verification / magic-link style callback (token_hash + type).
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "email";
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email",
      token_hash: tokenHash,
    });
    if (!error) {
      const profile = await activateUser(supabase);
      return NextResponse.redirect(redirectTarget(profile ? roleHome(profile.role) : "/dashboard"));
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
