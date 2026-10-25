import type { Insight } from "./shape";

export type StatusTone = "ok" | "warn" | "bad" | "neutral";
export type Status = { label: string; tone: StatusTone };

/** Header chip for the health score: same bands as the score card. */
export function scoreStatus(score: number): Status {
  if (score >= 85) return { label: "Excellent", tone: "ok" };
  if (score >= 70) return { label: "Good", tone: "ok" };
  if (score >= 50) return { label: "Watch", tone: "warn" };
  return { label: "Critical", tone: "bad" };
}

/** Header chip for any other section, from its insight. */
export function insightStatus(i: Insight): Status {
  if (i.state === "great") return { label: "Healthy", tone: "ok" };
  if (i.state === "nodata") return { label: "No data", tone: "neutral" };
  return { label: "Needs attention", tone: i.items.some((t) => t.tone === "bad") ? "bad" : "warn" };
}
