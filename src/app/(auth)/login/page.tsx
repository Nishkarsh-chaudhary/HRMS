"use client";

import Link from "next/link";
import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { login, resendVerification } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResendVerification({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerification, undefined);

  return (
    <form action={action} className="mt-4 flex flex-col items-start gap-3">
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 rounded-lg text-xs font-semibold"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        Resend verification email
      </Button>
      {state?.message && (
        <p className={state.success ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const verificationFailed = searchParams.get("error") === "auth";
  const signedOut = searchParams.get("signed_out") === "1";

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to HRMS
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Employee accounts are created securely by your HR administrator.
        </p>
      </div>

      <form action={action} className="space-y-5">
        {signedOut && !state?.message && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 />
            <AlertDescription>You have been signed out successfully.</AlertDescription>
          </Alert>
        )}
        {verificationFailed && !state?.message && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              We could not verify that link. It may have expired or already been used. Request a new verification email and try again.
            </AlertDescription>
          </Alert>
        )}
        {state?.message && (
          <Alert
            variant={state.needsVerification ? "default" : "destructive"}
            className={state.needsVerification ? "border-amber-200 bg-amber-50 text-amber-800" : undefined}
          >
            {state.needsVerification ? <Mail /> : <AlertCircle />}
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {state?.needsVerification && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Check your inbox for the verification link we sent you, then sign in
              again. Didn&apos;t get it?
            </p>
            <ResendVerification email={state.email ?? ""} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            className="h-11 rounded-lg border-input bg-white px-4 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-invalid={!!state?.errors?.email}
          />
          {state?.errors?.email && (
            <p className="text-sm text-destructive">{state.errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
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
            <p className="text-sm text-destructive">{state.errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
          disabled={pending}
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
