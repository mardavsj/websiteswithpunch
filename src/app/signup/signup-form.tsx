"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { intervalParam, type BillingInterval } from "@/lib/billing-interval";
import { PASSWORD_MAX } from "@/lib/password-rules";
import { AuthNotice } from "@/components/auth/AuthShell";
import {
  PasswordField,
  PasswordHint,
  SubmitButton,
  TextField,
  authLink,
  emailError,
  newPasswordErrors,
} from "@/components/auth/fields";
import { SignupHeader, paidButtonLabel } from "./signup-header";

type Errors = { name?: string; email?: string; password?: string; confirm?: string; form?: string };

export function SignupForm({
  initialPlan = "free",
  initialInterval = "month",
  canceled = false,
}: {
  initialPlan?: PlanId;
  initialInterval?: BillingInterval;
  canceled?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [interval, setBilling] = useState<BillingInterval>(initialInterval);

  const isPaid = initialPlan === "pro" || initialPlan === "business";

  /** Server errors: a duplicate email (409) is shown on the email field, the rest above the form. */
  function serverError(status: number, message: string) {
    setErrors(status === 409 ? { email: message } : { form: message });
    setLoading(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {
      name: name.trim() ? undefined : "Enter your name.",
      email: emailError(email),
      ...newPasswordErrors(password, confirm),
    };
    setErrors(next);
    if (next.name || next.email || next.password || next.confirm) return;

    setLoading(true);
    const cleanEmail = email.trim();
    try {
      if (isPaid) {
        const res = await fetch("/api/stripe/checkout-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: cleanEmail,
            password,
            planId: initialPlan,
            interval: intervalParam(interval),
          }),
        });
        const data = await res.json();
        if (!res.ok) return serverError(res.status, data.error || "Could not start checkout");
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        return serverError(500, "Checkout unavailable");
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) return serverError(res.status, data.error || "Signup failed");
      const login = await signIn("credentials", {
        email: cleanEmail.toLowerCase(),
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      // Full load so no signed-out router-cache entry is reused (see login-form); the button
      // keeps its loading label until the dashboard shows.
      window.location.replace("/dashboard");
    } catch {
      setErrors({ form: "Network error. Check your connection and try again." });
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? isPaid
      ? "Redirecting to payment…"
      : "Creating account…"
    : isPaid
      ? paidButtonLabel(initialPlan, interval)
      : "Sign up free";

  return (
    <div className="flex flex-col">
      <SignupHeader
        planId={initialPlan}
        interval={interval}
        onInterval={setBilling}
        loading={loading}
        canceled={canceled}
      />
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.form && (
          <AuthNotice tone="error" className="">
            {errors.form}
          </AuthNotice>
        )}
        <TextField
          id="name"
          label="Name"
          autoComplete="name"
          placeholder="Alex Morgan"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          disabled={loading}
        />
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
          autoComplete="new-password"
          placeholder="Create a password"
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={<PasswordHint password={password} />}
          disabled={loading}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          maxLength={PASSWORD_MAX}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          disabled={loading}
        />
        <SubmitButton loading={loading}>{buttonLabel}</SubmitButton>
        {isPaid && <p className="text-center text-xs text-muted">Payments are non-refundable.</p>}
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className={authLink}>
          Log in
        </Link>
        {isPaid && (
          <>
            {" · "}
            <Link href="/signup" className={authLink}>
              Start free instead
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
