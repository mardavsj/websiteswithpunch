"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

export function SignupForm({
  initialPlan = "free",
  canceled = false,
}: {
  initialPlan?: PlanId;
  canceled?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPaid = initialPlan === "pro" || initialPlan === "business";
  const plan = PLANS[initialPlan];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isPaid) {
        const res = await fetch("/api/stripe/checkout-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            planId: initialPlan,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not start checkout");
          setLoading(false);
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError("Checkout unavailable");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const title = isPaid ? `Start ${plan.name}` : "Create your account";
  const subtitle = isPaid
    ? `You’ll pay $${plan.price}/mo for up to ${plan.siteLimit} sites. Account is created after payment succeeds.`
    : "Free plan includes 1 monitored site. Upgrade anytime for more sites.";
  const buttonLabel = loading
    ? isPaid
      ? "Redirecting to payment…"
      : "Creating…"
    : isPaid
      ? `Continue to payment — $${plan.price}/mo`
      : "Sign up free";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-medium text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
      {canceled && (
        <p className="mt-3 rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Checkout was canceled. You can try again when you’re ready — no account was created.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-none border border-rule bg-bg p-6">
        <div>
          <label className="text-sm font-medium text-ink">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-none border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-none border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-none border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-none bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
        {isPaid && (
          <>
            {" · "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Start free instead
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
