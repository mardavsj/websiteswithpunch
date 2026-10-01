import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { PlanId } from "@/lib/plans";
import { parseInterval } from "@/lib/billing-interval";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

function parsePlan(raw: string | string[] | undefined): PlanId {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "pro" || v === "business") return v;
  return "free";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string; interval?: string; canceled?: string };
}) {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  const initialPlan = parsePlan(searchParams.plan);

  return (
    <AuthShell>
      <SignupForm
        initialPlan={initialPlan}
        initialInterval={parseInterval(searchParams.interval)}
        canceled={searchParams.canceled === "1"}
      />
    </AuthShell>
  );
}
