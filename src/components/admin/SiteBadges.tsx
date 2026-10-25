import { Badge } from "./ui";

export const statusTone = (s: string) => (s === "up" ? "ok" : s === "down" || s === "error" ? "danger" : "muted");
export function SiteStatus({ status, locked }: { status: string; locked: boolean }) {
  if (locked) return <Badge>locked</Badge>;
  const label = status === "up" ? "up" : status === "down" || status === "error" ? (status === "error" ? "down (error)" : "down") : "unknown";
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}
/** Days left, red at ≤7, accent at ≤30. */
export function Days({ n }: { n: number | null }) {
  if (n === null) return <span className="text-muted">—</span>;
  return <span className={`tabular-nums ${n <= 7 ? "text-danger" : n <= 30 ? "text-accent" : "text-ink"}`}>{n < 0 ? "expired" : `${n}d`}</span>;
}
