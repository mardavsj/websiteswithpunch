import type { PlanId } from "./plans";

/**
 * Which "Upgrade to …" buttons a plan may show: Free sees Pro and Business, Pro sees
 * Business, Business sees none. Unknown (session still loading) sees none.
 */
export function upgradeTargets(plan: PlanId | null | undefined): ("pro" | "business")[] {
  if (plan === "free") return ["pro", "business"];
  if (plan === "pro") return ["business"];
  return [];
}
