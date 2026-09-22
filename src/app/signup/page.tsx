import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { PlanId } from "@/lib/plans";
import { SignupForm } from "./signup-form";

function parsePlan(raw: string | string[] | undefined): PlanId {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "pro" || v === "business") return v;
  return "free";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string; canceled?: string };
}) {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  const initialPlan = parsePlan(searchParams.plan);

  return (
    <SignupForm
      initialPlan={initialPlan}
      canceled={searchParams.canceled === "1"}
    />
  );
}
