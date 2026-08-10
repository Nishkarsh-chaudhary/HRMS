"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { acceptInvite } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SetPasswordForm({
  token,
  email,
  fullName,
}: {
  token: string;
  email: string;
  fullName: string;
}) {
  const [state, action, pending] = useActionState(acceptInvite, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {state?.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{fullName}</span> · {email}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-foreground">
          Create a password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters, A–Z, 0–9"
            className="h-11 rounded-lg border-input bg-white px-4 pr-12 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-invalid={!!state?.errors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state?.errors?.password && (
          <ul className="text-sm text-destructive">
            {state.errors.password.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          className="h-11 rounded-lg border-input bg-white px-4 pr-12 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          aria-invalid={!!state?.errors?.confirmPassword}
        />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
        disabled={pending}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Activate my account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
