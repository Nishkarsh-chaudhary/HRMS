"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import {
  AdminAccountSchema,
  CompanyDetailsSchema,
  CreateEmployeeSchema,
  InviteAcceptSchema,
  LoginSchema,
  RecoveryEmailSchema,
  ResetPasswordSchema,
  type AuthFormState,
} from "@/lib/auth/definitions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireUserAdmin } from "@/lib/auth/dal";
import { getSiteUrl } from "@/lib/site-url";
import { inviteEmailHtml, sendEmail } from "@/lib/email";
import { ROLES } from "@/lib/constants";

function publicOrganisationSignupEnabled(): boolean {
  return false;
}

// ---------------------------------------------------------------------------
// Flow 2 — Login
// ---------------------------------------------------------------------------
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        message: "Verify your email before signing in. You can resend the verification email below.",
        needsVerification: true,
        email: parsed.data.email,
        notice: "verification_required",
      };
    }
    return {
      message:
        error.code === "invalid_credentials"
          ? "The email or password is incorrect. Please try again."
          : "We could not sign you in right now. Please try again shortly.",
    };
  }
  const authUserId = signInData.user?.id;

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role, status")
    .eq("auth_user_id", authUserId ?? "")
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { message: "No account found for this user. Contact your admin." };
  }

  if (profile.status === "invited") {
    // Reaching this point means Supabase accepted the password login, so the
    // Auth email is already confirmed. Keep the application profile in sync.
    const { error: activationError } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", profile.id);

    if (activationError) {
      await supabase.auth.signOut();
      return {
        message: "Your email is verified, but we could not activate your HRMS profile. Please contact your administrator.",
      };
    }

    if (profile.role === ROLES.SUPER_ADMIN) {
      await supabase
        .from("companies")
        .update({ status: "active" })
        .eq("id", profile.company_id);
    }
  }
  if (profile.status === "suspended" || profile.status === "deactivated") {
    await supabase.auth.signOut();
    return { message: "This account is not active. Contact your admin." };
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Password recovery — email OTP, then replace password
// ---------------------------------------------------------------------------
export async function sendPasswordResetOtp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = RecoveryEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error?.code === "over_email_send_rate_limit") {
    return { message: "Too many reset requests. Wait a minute before trying again." };
  }
  if (error) {
    return { message: "We could not send the OTP right now. Please try again shortly." };
  }

  // Keep this response generic so the form does not reveal registered emails.
  return {
    success: true,
    email: parsed.data.email,
    message: "If an account exists for this email, a password-reset OTP has been sent.",
  };
}

export async function resetPasswordWithOtp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.otp,
    type: "recovery",
  });
  if (otpError) {
    return { message: "The OTP is incorrect or has expired. Request a new OTP and try again." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  await supabase.auth.signOut();

  if (passwordError) {
    return { message: "The password could not be updated. Request a new OTP and try again." };
  }

  return {
    success: true,
    message: "Your password has been changed. You can now sign in with the new password.",
  };
}

// ---------------------------------------------------------------------------
// Flow 1 — Company + Super Admin signup (multi-step form, single action)
// ---------------------------------------------------------------------------
export async function signupCompany(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // This deployment serves one organisation. Organisation provisioning is
  // intentionally disabled; employee identities are created by Super Admins.
  if (!publicOrganisationSignupEnabled()) {
    return { message: "Public account and organisation creation is disabled. Contact your HR administrator for access." };
  }
  const companyParsed = CompanyDetailsSchema.safeParse({
    companyName: formData.get("companyName"),
    slug: formData.get("slug"),
    industry: formData.get("industry") || undefined,
    companySize: formData.get("companySize") || undefined,
  });
  if (!companyParsed.success) {
    return { errors: companyParsed.error.flatten().fieldErrors };
  }

  const adminParsed = AdminAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!adminParsed.success) {
    return { errors: adminParsed.error.flatten().fieldErrors };
  }

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();

  // 1. Create the Supabase Auth identity (sends verification email).
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: adminParsed.data.email,
    password: adminParsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/verify-callback`,
      data: { full_name: adminParsed.data.fullName },
    },
  });

  if (signUpError) {
    return {
      message:
        signUpError.code === "user_already_exists"
          ? "An account with this email already exists."
          : "We could not create your account right now. Please try again shortly.",
    };
  }
  if (!signUpData.user) {
    return { message: "Could not create your account. Please try again." };
  }

  const admin = createAdminClient();

  // 2. Atomically create the company + super-admin users row (RPC).
  const { data: rpcData, error: rpcError } = await admin.rpc("signup_company", {
    p_company_name: companyParsed.data.companyName,
    p_slug: companyParsed.data.slug,
    p_industry: companyParsed.data.industry ?? "",
    p_company_size: companyParsed.data.companySize ?? "",
    p_timezone: "Asia/Kolkata",
    p_auth_user_id: signUpData.user.id,
    p_full_name: adminParsed.data.fullName,
    p_email: adminParsed.data.email,
  });

  if (rpcError || !rpcData) {
    // Roll back the auth identity so the email isn't stuck.
    await admin.auth.admin.deleteUser(signUpData.user.id);
    return {
      message:
        rpcError?.code === "23505"
          ? "This company or email is already registered. Try signing in instead."
          : "We could not finish setting up your company. Your login was not created; please try again.",
    };
  }

  const result = rpcData as { company_id: string; slug: string };

  // 3. Embed company + role claims in the JWT (used by RLS policies).
  await admin.auth.admin.updateUserById(signUpData.user.id, {
    app_metadata: { company_id: result.company_id, role: ROLES.SUPER_ADMIN },
  });

  // If the project has email confirmation disabled, a session is returned —
  // activate immediately so the flow still completes.
  if (signUpData.session) {
    const { error: upErr } = await admin
      .from("users")
      .update({ status: "active" })
      .eq("auth_user_id", signUpData.user.id);
    if (!upErr) {
      await admin.from("companies").update({ status: "active" }).eq("id", result.company_id);
    }
    redirect("/dashboard");
  }

  return {
    success: true,
    email: adminParsed.data.email,
    slug: result.slug,
    companyName: companyParsed.data.companyName,
  };
}

export async function resendVerification(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { message: "Enter your email address." };

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/verify-callback` },
  });

  return {
    success: !error,
    message: error
      ? "Could not resend the email. Try again shortly."
      : "Verification email sent. Check your inbox.",
  };
}

// ---------------------------------------------------------------------------
// Flow 3 — Admin invites an employee (no self signup)
// ---------------------------------------------------------------------------
export async function createEmployeeInvite(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const adminProfile = await requireUserAdmin();
  const siteUrl = await getSiteUrl();

  const parsed = CreateEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || null,
    designationId: formData.get("designationId") || null,
    reportingManagerId: formData.get("reportingManagerId") || null,
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .eq("company_id", adminProfile.company_id)
    .maybeSingle();
  if (existing) {
    return { message: "A user with this email already exists in your company." };
  }

  // Optional: keep the reporting manager scoped to this company.
  let reportingManagerId: string | null = parsed.data.reportingManagerId;
  if (reportingManagerId) {
    const { data: manager } = await supabase
      .from("users")
      .select("id")
      .eq("id", reportingManagerId)
      .eq("company_id", adminProfile.company_id)
      .maybeSingle();
    if (!manager) reportingManagerId = null;
  }

  const inviteToken = randomBytes(24).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      company_id: adminProfile.company_id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      role: parsed.data.role,
      status: "invited",
      department_id: parsed.data.departmentId,
      designation_id: parsed.data.designationId,
      reporting_manager_id: reportingManagerId,
      invited_by: adminProfile.id,
      invite_token: inviteToken,
      invite_expires_at: inviteExpiresAt,
    })
    .select("id, full_name")
    .single();

  if (insertError || !created) {
    return { message: "Could not create the invite. Please try again." };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", adminProfile.company_id)
    .single();

  const inviteUrl = `${siteUrl}/invite/${inviteToken}`;
  await sendEmail({
    to: parsed.data.email,
    subject: `You're invited to ${company?.name ?? "your company"} on HRMS`,
    html: inviteEmailHtml({
      inviteUrl,
      fullName: parsed.data.fullName,
      companyName: company?.name ?? "your company",
    }),
  });

  return {
    success: true,
    message: `Invitation sent to ${parsed.data.email}.`,
    inviteUrl,
    userId: created.id,
  };
}

export async function resendInvite(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const adminProfile = await requireUserAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { message: "Missing user." };

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, email, company_id")
    .eq("id", userId)
    .eq("company_id", adminProfile.company_id)
    .maybeSingle();
  if (!user) return { message: "User not found in your company." };

  const inviteToken = randomBytes(24).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("users")
    .update({ invite_token: inviteToken, invite_expires_at: inviteExpiresAt, status: "invited" })
    .eq("id", user.id);
  if (error) return { message: "Could not regenerate the invite." };

  const siteUrl = await getSiteUrl();
  const inviteUrl = `${siteUrl}/invite/${inviteToken}`;
  await sendEmail({
    to: user.email,
    subject: `You're invited to HRMS`,
    html: inviteEmailHtml({ inviteUrl, fullName: user.full_name, companyName: "your company" }),
  });

  return { success: true, message: `Invitation re-sent to ${user.email}.`, inviteUrl };
}

// ---------------------------------------------------------------------------
// Flow 3 — Invitee sets their password (/invite/[token])
// ---------------------------------------------------------------------------
export async function acceptInvite(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { message: "This invite link is invalid or has expired." };

  const parsed = InviteAcceptSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const inviteResult = await admin.rpc("get_invite", { p_token: token });
  const invite = inviteResult.data as
    | { valid: true; id: string; full_name: string; email: string }
    | { valid: false; reason: string }
    | null;

  if (inviteResult.error || !invite || !invite.valid) {
    return { message: "This invite link is invalid or has expired." };
  }

  // 1. Create the Supabase Auth identity for the invited email.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createError) {
    return {
      message:
        createError.code === "user_already_exists"
          ? "An account with this email already exists. Contact your admin."
          : "Could not create your account. Please try again.",
    };
  }

  // 2. Link the auth identity to the invited row (preserves role/manager data).
  const { data: acceptData, error: acceptError } = await admin.rpc("accept_invite", {
    p_token: token,
    p_auth_user_id: created.user.id,
  });
  if (acceptError || !acceptData) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { message: "This invite is no longer valid." };
  }

  const accepted = acceptData as { company_id: string; role: string };

  // 3. Embed company + role claims in the JWT.
  await admin.auth.admin.updateUserById(created.user.id, {
    app_metadata: { company_id: accepted.company_id, role: accepted.role },
  });

  // 4. Auto sign-in and send them to their home.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: parsed.data.password,
  });
  if (signInError) {
    return { message: "Account created. Please log in." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  // Global scope revokes every refresh token for this Auth user. The SSR
  // client also clears the authentication cookies on this response.
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    // Always clear this browser session even if global token revocation is
    // temporarily unavailable.
    await supabase.auth.signOut({ scope: "local" });
  }
  revalidatePath("/", "layout");
  redirect("/login?signed_out=1");
}
