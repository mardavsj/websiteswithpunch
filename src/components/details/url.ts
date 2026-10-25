import { isFixKey } from "@/lib/insights/focus";
import type { FixKey } from "@/lib/insights/health";
import type { DetailsSection } from "./types";

/** What the analytics modal shows: one Details section, or the fixes ("fixes", maybe focused). */
export type View = { s: DetailsSection | "fixes"; fix?: FixKey };

const SECTIONS: string[] = ["health", "uptime", "latency", "downtime", "trend", "timeline", "ssl", "domain", "incidents", "codes", "fixes"];

/** Reads ?details=<section>&fix=<key> from a query string. */
export function viewFromSearch(search: string): View | null {
  const q = new URLSearchParams(search);
  const s = q.get("details");
  if (!s || !SECTIONS.includes(s)) return null;
  const fix = q.get("fix");
  return { s: s as View["s"], fix: s === "fixes" && isFixKey(fix) ? fix : undefined };
}

/** Current URL with the modal params set (or removed when `v` is null). */
export function urlFor(v: View | null): string {
  const u = new URL(window.location.href);
  u.searchParams.delete("details");
  u.searchParams.delete("fix");
  if (v) {
    u.searchParams.set("details", v.s);
    if (v.fix) u.searchParams.set("fix", v.fix);
  }
  return u.pathname + u.search + u.hash;
}
