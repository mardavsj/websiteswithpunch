"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";
import { SubmitButton, authLink } from "@/components/auth/fields";
import { CODE_LENGTH, CodeInput } from "@/components/auth/CodeInput";
import { intervalParam, type BillingInterval } from "@/lib/billing-interval";

const empty = () => Array<string>(CODE_LENGTH).fill("");

export function VerifyForm({
  masked,
  initialCooldown,
  hasCode,
  plan,
  interval,
}: {
  masked: string;
  initialCooldown: number;
  hasCode: boolean;
  plan: "pro" | "business" | null;
  interval: BillingInterval;
}) {
  const { update } = useSession();
  const [digits, setDigits] = useState(empty);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const autoSent = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function finish() {
    setDone(true);
    await update().catch(() => null); // re-issues the session cookie with the verified flag
    if (plan) {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, interval: intervalParam(interval) }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (data?.url) return void (window.location.href = data.url);
      return void window.location.replace("/plan");
    }
    window.location.replace("/dashboard");
  }

  async function submit(code: string) {
    if (checking || done) return;
    setChecking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return void (await finish());
      setError(data.error || "Could not verify. Please try again.");
      setDigits(empty());
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setChecking(false);
  }

  async function resend() {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCooldown(data.cooldown ?? 60);
        setDigits(empty());
        setNotice(`New code sent to ${masked}.`);
      } else {
        setError(data.error || "Could not send a code. Please try again.");
        if (data.retryAfter) setCooldown(Math.min(Number(data.retryAfter), 3600));
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setSending(false);
  }

  // No live code (e.g. it expired before the page opened): send one straight away.
  useEffect(() => {
    if (!hasCode && initialCooldown <= 0 && !autoSent.current) {
      autoSent.current = true;
      void resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function wrongEmail() {
    setLeaving(true);
    await fetch("/api/auth/verify-email/abandon", { method: "POST" }).catch(() => null);
    await signOut({ callbackUrl: "/signup" });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return setError("Enter all 6 digits.");
    void submit(code);
  }

  return (
    <>
      <AuthHeading title="Check your email">
        We sent a 6-digit code to <span className="font-medium text-ink">{masked}</span>.{" "}
        <button type="button" onClick={wrongEmail} disabled={leaving} className={authLink}>
          Wrong email?
        </button>
      </AuthHeading>
      {done ? (
        <AuthNotice tone="success">
          Email verified. {plan ? "Taking you to payment…" : "Opening your dashboard…"}
        </AuthNotice>
      ) : notice ? (
        <AuthNotice tone="success">{notice}</AuthNotice>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <p className="mb-2 block text-sm font-medium text-ink">Verification code</p>
          <CodeInput
            digits={digits}
            onChange={(d) => {
              setDigits(d);
              if (error) setError(null);
            }}
            onComplete={submit}
            disabled={checking || done}
            invalid={Boolean(error)}
            describedBy={error ? "code-error" : "code-hint"}
          />
          {error ? (
            <p id="code-error" role="alert" className="mt-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : (
            <p id="code-hint" className="mt-2 text-xs text-muted">
              The code expires in 10 minutes. Check spam if it isn&apos;t in your inbox.
            </p>
          )}
        </div>
        <SubmitButton loading={checking || done}>
          {done ? "Verified" : checking ? "Checking…" : "Verify email"}
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        Didn&apos;t get it?{" "}
        {cooldown > 0 ? (
          <span className="tabular-nums">Resend code in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} disabled={sending} className={authLink}>
            {sending ? "Sending…" : "Resend code"}
          </button>
        )}
      </p>
    </>
  );
}
