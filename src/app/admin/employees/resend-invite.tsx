"use client";

import { useActionState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { resendInvite } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/lib/auth/definitions";

export function ResendInviteButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    resendInvite,
    undefined
  );

  if (state?.success) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sent
      </span>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-accent hover:text-primary"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Mail className="h-3.5 w-3.5" />
        )}
        Resend invite
      </Button>
    </form>
  );
}
