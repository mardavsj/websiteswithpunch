import type { Tone } from "@/components/details/ui";
import type { BillingSummary } from "@/components/billing/types";
import type { PlanId } from "@/lib/plans";

/** One status chip for the plan hero; the most urgent state wins. */
export function planStatus(
  plan: PlanId,
  s: BillingSummary | null,
  fallback: { cancelAtPeriodEnd?: boolean; pendingPlan?: string | null },
): { tone: Tone; label: string } {
  if (plan === "free") return { tone: "neutral", label: "Free forever" };
  if (s?.paymentFailed) return { tone: "bad", label: "Payment failed" };
  const cancel = s?.cancelAtPeriodEnd ?? fallback.cancelAtPeriodEnd;
  const date = s?.pendingPlanAtFormatted;
  if (cancel) return { tone: "warn", label: date ? `Ends ${date}` : "Ends at renewal" };
  if ((s?.pendingPlan ?? fallback.pendingPlan) === "pro") return { tone: "warn", label: date ? `Pro from ${date}` : "Switching to Pro" };
  if (s?.pendingInterval === "month") return { tone: "accent", label: "Monthly from renewal" };
  if (s?.hasPendingRemoval) return { tone: "accent", label: "Pack change booked" };
  return { tone: "ok", label: "Active" };
}
