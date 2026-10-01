"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";
import { SubmitButton, TextField, authLink, emailError } from "@/components/auth/fields";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = emailError(email);
    setError(err);
    setFormError(null);
    if (err) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || "Could not send a reset link. Please try again.");
        return;
      }
      setSent(data.message || "If an account exists, we've sent a reset link.");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <AuthHeading title="Check your email" />
        <AuthNotice tone="success">{sent}</AuthNotice>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The link expires in 1 hour and works once. If nothing arrives in a few minutes, check
          your spam folder or{" "}
          <button type="button" onClick={() => setSent(null)} className={authLink}>
            try again
          </button>
          .
        </p>
        <p className="mt-8 text-sm">
          <Link href="/login" className={authLink}>
            ← Back to log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Forgot your password?">
        Enter the email you signed up with and we&apos;ll send you a link to set a new password.
      </AuthHeading>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {formError && (
          <AuthNotice tone="error" className="">
            {formError}
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
          error={error}
          disabled={loading}
        />
        <SubmitButton loading={loading}>{loading ? "Sending link…" : "Send reset link"}</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      </p>
    </>
  );
}
