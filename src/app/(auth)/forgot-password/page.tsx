"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import {
  resetPasswordWithOtp,
  sendPasswordResetOtp,
} from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sendState, sendAction, sending] = useActionState(
    sendPasswordResetOtp,
    undefined
  );
  const [resetState, resetAction, resetting] = useActionState(
    resetPasswordWithOtp,
    undefined
  );
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (resetState?.success) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Password changed
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {resetState.message}
        </p>
        <Button nativeButton={false} render={<Link href="/login" />} className="mt-7 h-11 w-full rounded-lg">
          Continue to sign in
        </Button>
      </div>
    );
  }

  const otpSent = sendState?.success && sendState.email;

  return (
    <div>
      <div className="mb-8">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          {otpSent ? (
            <KeyRound className="h-6 w-6 text-primary" />
          ) : (
            <Mail className="h-6 w-6 text-primary" />
          )}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {otpSent ? "Enter OTP and new password" : "Forgot your password?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {otpSent
            ? `Enter the OTP sent to ${sendState.email}.`
            : "Enter your account email and we’ll send you a password-reset OTP."}
        </p>
      </div>

      {!otpSent ? (
        <form action={sendAction} className="space-y-5">
          {sendState?.message && !sendState.success && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{sendState.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="recovery-email" className="text-sm font-semibold text-foreground">
              Email
            </Label>
            <Input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              aria-invalid={!!sendState?.errors?.email}
              className="h-11 rounded-lg border-input bg-white px-4"
            />
            {sendState?.errors?.email && (
              <p className="text-sm text-destructive">{sendState.errors.email}</p>
            )}
          </div>
          <Button type="submit" className="h-11 w-full rounded-lg" disabled={sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
          <Link
            href="/login"
            className="mx-auto flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      ) : (
        <form action={resetAction} className="space-y-5">
          <input type="hidden" name="email" value={sendState.email} />

          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 />
            <AlertDescription>{sendState.message}</AlertDescription>
          </Alert>
          {resetState?.message && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{resetState.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-semibold text-foreground">
              Email OTP
            </Label>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              maxLength={8}
              required
              aria-invalid={!!resetState?.errors?.otp}
              className="h-12 rounded-lg border-input bg-white px-4 text-center font-mono text-lg tracking-[0.35em]"
            />
            {resetState?.errors?.otp && (
              <p className="text-sm text-destructive">{resetState.errors.otp}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">
              New password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters, A–Z, 0–9"
                minLength={8}
                required
                aria-invalid={!!resetState?.errors?.password}
                className="h-11 rounded-lg border-input bg-white px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetState?.errors?.password && (
              <ul className="text-sm text-destructive">
                {resetState.errors.password.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              minLength={8}
              required
              aria-invalid={!!resetState?.errors?.confirmPassword}
              className="h-11 rounded-lg border-input bg-white px-4"
            />
            {resetState?.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{resetState.errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full rounded-lg" disabled={resetting}>
            {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change password
          </Button>

          <Button
            type="submit"
            formAction={sendAction}
            variant="ghost"
            className="h-10 w-full gap-2 text-sm"
            disabled={sending || resetting}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resend OTP
          </Button>
        </form>
      )}
    </div>
  );
}
