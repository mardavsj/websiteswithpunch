"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_MAX } from "@/lib/password-rules";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";
import {
  PasswordField,
  PasswordHint,
  SubmitButton,
  authLink,
  newPasswordErrors,
} from "@/components/auth/fields";
import { TokenProblem, type TokenProblemState } from "./token-problem";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [problem, setProblem] = useState<TokenProblemState | null>(null);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/login?reset=1"), 4000);
    return () => clearTimeout(t);
  }, [done, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = newPasswordErrors(password, confirm);
    setErrors(next);
    if (next.password || next.confirm) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        return;
      }
      if (data.state === "expired" || data.state === "used" || data.state === "invalid") {
        setProblem(data.state);
        return;
      }
      setErrors({ form: data.error || "Could not reset your password. Please try again." });
    } catch {
      setErrors({ form: "Network error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  if (problem) return <TokenProblem state={problem} />;

  if (done) {
    return (
      <>
        <AuthHeading title="Password updated" />
        <AuthNotice tone="success">
          Your password has been changed. You can now log in with your new password.
        </AuthNotice>
        <p className="mt-4 text-sm text-muted">Taking you to the login page…</p>
        <Link
          href="/login?reset=1"
          className="mt-6 flex w-full items-center justify-center rounded-none bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Log in
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Set a new password">
        Choose a new password for your account. This link works once and expires 1 hour after it
        was sent.
      </AuthHeading>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.form && (
          <AuthNotice tone="error" className="">
            {errors.form}
          </AuthNotice>
        )}
        <PasswordField
          id="password"
          label="New password"
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
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          maxLength={PASSWORD_MAX}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          disabled={loading}
        />
        <SubmitButton loading={loading}>{loading ? "Updating…" : "Update password"}</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      </p>
    </>
  );
}
