"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getEffectivePlan, type PlanId } from "@/lib/plans";

/**
 * The navbar and profile menu read the plan from the session, which only refreshes on a full
 * load or tab focus. Pages that read the plan from the database render this with that plan;
 * when they disagree (an upgrade or self-heal followed by router.refresh), re-fetch the session
 * so the upgrade buttons match the page.
 */
export function SessionPlanSync({ plan }: { plan: PlanId }) {
  const { data: session, status, update } = useSession();
  const asked = useRef<string | null>(null);
  const sessionPlan = session?.user
    ? getEffectivePlan(session.user.plan, session.user.dodoStatus ?? null)
    : null;

  useEffect(() => {
    if (status !== "authenticated" || !sessionPlan || sessionPlan === plan) return;
    const key = `${sessionPlan}->${plan}`;
    if (asked.current === key) return; // one refetch per mismatch, never a loop
    asked.current = key;
    void update();
  }, [status, sessionPlan, plan, update]);

  return null;
}
