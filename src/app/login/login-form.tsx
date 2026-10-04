"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";
import { PasswordField, SubmitButton, TextField, authLink, emailError } from "@/components/auth/fields";

/** Only same-origin paths; anything else (or an auth page) falls back to the dashboard. */
function safeCallback(raw: string | null): string {
  if (!raw) return "/dashboard";
  try {
    const u = new URL(raw, window.location.origin);
    const auth = /^\/(login|signup|forgot-password|reset-password)(\/|$)/.test(u.pathname);
    if (u.origin === window.location.origin && !auth) return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    /* fall through */
  }
  return "/dashboard";
}

type Errors = { email?: string; password?: string; form?: string };

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const paid = params.get("paid") === "1";
  const reset = params.get("reset") === "1";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {
      email: emailError(email),
      password: password ? undefined : "Enter your password.",
    };
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    const callbackUrl = safeCallback(params.get("callbackUrl"));
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    }).catch(() => null);
    if (!res || res.error) {
      setLoading(false);
      setErrors({
        form:
          res?.error === "CredentialsSignin"
            ? "Incorrect email or password."
            : res?.error === "RATE_LIMITED"
              ? "Too many login attempts. Please wait 15 minutes and try again."
              : "Could not log in. Please try again.",
      });
      return;
    }
    // Full load, not router.replace: links prefetched while signed out (e.g. the footer's
    // Dashboard) sit in the router cache as redirects to /login, and reusing one bounced between
    // the two pages forever. The button stays on "Logging in…" until the next page shows.
    window.location.replace(callbackUrl);
  }

  return (
    <>
      <AuthHeading title="Log in">Welcome back. Log in to see your sites.</AuthHeading>
      {paid && (
        <AuthNotice tone="success">
          Payment successful — your account is ready. Log in with the email and password you just
          chose.
        </AuthNotice>
      )}
      {reset && (
        <AuthNotice tone="success">Your password was updated. Log in with your new password.</AuthNotice>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.form && (
          <AuthNotice tone="error" className="">
            {errors.form}
          </AuthNotice>
        )}
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={loading}
          aside={
            <Link href="/forgot-password" className={`text-xs ${authLink}`}>
              Forgot password?
            </Link>
          }
        />
        <SubmitButton loading={loading}>{loading ? "Logging in…" : "Log in"}</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        New to Websites With Punch?{" "}
        <Link href="/signup" className={authLink}>
          Create an account
        </Link>
      </p>
    </>
  );
}
