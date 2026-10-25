import type { AnalyticsPayload } from "@/components/analytics-types";
import { great, improve, nodata, type Insight, type Tip } from "./shape";

type Inc = AnalyticsPayload["incidents"][number];
const kind = (i: Inc): "5xx" | "4xx" | "conn" => (i.statusCode != null && i.statusCode >= 500 ? "5xx" : i.statusCode != null && i.statusCode >= 400 ? "4xx" : "conn");

const STEPS: Record<"5xx" | "4xx" | "conn", Omit<Tip, "lacking" | "tone">> = {
  "5xx": {
    title: "Server errors (5xx)",
    steps: [
      "Check your app and server error logs at the times listed in Incidents.",
      "Look for crashes, memory limits or a database that stopped responding.",
      "If a deploy caused it, roll back and add a health check before going live.",
    ],
  },
  "4xx": {
    title: "Page refused (4xx)",
    steps: [
      "Make sure the monitored address still exists and isn't behind a login.",
      "Check that a firewall, bot protection or rate limit isn't blocking our checker.",
    ],
  },
  conn: {
    title: "No response (timeouts or connection errors)",
    steps: [
      "Check that the server and its DNS records were up at those times.",
      "Look for a server overloaded by traffic, or a host-level outage on its status page.",
      "Make sure firewalls allow our checker through.",
    ],
  },
};

/** Downtime and Incidents: group failures by cause so the fix matches the problem. */
export function incidentAdvice(d: AnalyticsPayload): Insight {
  if (d.totals.checks === 0) return nodata("No checks in this range yet.");
  if (!d.incidents.length) return great("No incidents in this range. Nothing to fix.");
  const groups = new Map<string, Inc[]>();
  for (const i of d.incidents) groups.set(kind(i), [...(groups.get(kind(i)) ?? []), i]);
  const items: Tip[] = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([k, list]) => {
      const codes = [...new Set(list.map((i) => i.statusCode).filter((c): c is number => c != null))];
      const s = STEPS[k as keyof typeof STEPS];
      return {
        title: s.title,
        tone: "bad",
        lacking: `${list.length} incident${list.length === 1 ? "" : "s"}${codes.length ? ` (status ${codes.join(", ")})` : ""}${list.some((i) => !i.endedAt) ? ", one still ongoing" : ""}.`,
        steps: s.steps,
      };
    });
  return improve(items);
}

/** Status codes: anything other than 2xx is worth a look. */
export function codeAdvice(d: AnalyticsPayload): Insight {
  const e = Object.entries(d.statusCodes).map(([c, n]) => [Number(c), n] as const);
  if (!e.reduce((a, [, n]) => a + n, 0)) return nodata("No status codes recorded in this range.");
  const sum = (lo: number, hi: number) => e.filter(([c]) => c >= lo && c < hi).reduce((a, [, n]) => a + n, 0);
  const items: Tip[] = [];
  const n5 = sum(500, 600), n4 = sum(400, 500), n3 = sum(300, 400);
  if (n5) items.push({ ...STEPS["5xx"], tone: "bad", lacking: `${n5} check${n5 === 1 ? "" : "s"} got a server error.` });
  if (n4) items.push({ ...STEPS["4xx"], tone: "warn", lacking: `${n4} check${n4 === 1 ? "" : "s"} got a 4xx response.` });
  if (n3) {
    items.push({
      title: "Redirect as final answer (3xx)",
      tone: "warn",
      lacking: `${n3} check${n3 === 1 ? "" : "s"} ended on a redirect.`,
      steps: ["Point the monitored address and your links at the final URL to save a round trip.", "Check the redirect target is reachable and not looping."],
    });
  }
  return items.length ? improve(items) : great("Every response was a success code (2xx).");
}
