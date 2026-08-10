import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SetPasswordForm } from "./set-password-form";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Accept invite" };

type InviteResult = {
  valid: boolean;
  reason?: string;
  id?: string;
  full_name?: string;
  email?: string;
};

async function getInvite(token: string): Promise<InviteResult | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_invite", { p_token: token });
  if (error) return null;
  return data as InviteResult;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  return (
    <div>
      {!invite?.valid ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            This invite is invalid
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {invite?.reason === "already_used"
              ? "This invite has already been used."
              : invite?.reason === "expired"
                ? "This invite has expired."
                : "This invite link is invalid or has expired."}
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Invites are valid for 7 days.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">
            Ask your admin to send you a new invite, or{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              You&apos;re invited!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{invite.full_name}</span>.
              Set a password to activate your account — you&apos;ll be signed in automatically.
            </p>
          </div>

          <SetPasswordForm
            token={token}
            email={invite.email ?? ""}
            fullName={invite.full_name ?? ""}
          />
        </div>
      )}
    </div>
  );
}
