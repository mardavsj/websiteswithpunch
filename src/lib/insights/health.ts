import { HEALTH_WEIGHTS, healthScore } from "@/lib/health-score";

export type FixKey = "uptime" | "latency" | "ssl" | "domain";
/** One thing holding the health score below 100, with the points it would add back. */
export type Fix = { key: FixKey; title: string; lacking: string; gain: number; steps: string[]; tone: "warn" | "bad" };

export type HealthInput = {
  uptimePercent: number | null;
  avgLatencyMs: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
  /** Optional context that tailors the advice (never changes the score). */
  checks?: number;
  failed?: number;
  registrar?: string | null;
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const ORDER: FixKey[] = ["uptime", "latency", "ssl", "domain"];

function uptimeFix(i: HealthInput): Omit<Fix, "gain" | "key"> {
  const of = i.checks != null && i.failed != null ? ` (${i.failed} of ${i.checks} checks failed)` : "";
  return {
    title: "Uptime",
    tone: (i.uptimePercent ?? 100) < 99 ? "bad" : "warn",
    lacking: `Uptime ${i.uptimePercent}% in this range${of}. Full marks need 100%.`,
    steps: [
      "Open Incidents to see exactly when each failure happened and what we got back.",
      "Check your host's status page and your server logs around those times.",
      "Make sure the app restarts itself after a crash (process manager or platform health checks).",
      "If outages keep repeating, move to a plan or host with an uptime guarantee, or add a failover (CDN with origin failover, second server).",
    ],
  };
}

function latencyFix(ms: number): Omit<Fix, "gain" | "key"> {
  const steps = ["Serve the site through a CDN and cache pages that don't change per visitor."];
  if (ms > 500) steps.push("Find slow database queries or backend calls; add indexes or cache their results.");
  steps.push("Compress images and assets (WebP/AVIF, gzip or Brotli) so less has to travel.");
  if (ms > 1000) steps.push("Host the server in a region close to your visitors, or upgrade to a faster plan.");
  else steps.push("Use the response time chart to spot spikes and match them to deploys, backups or traffic peaks.");
  return {
    title: "Response time",
    tone: ms > 1000 ? "bad" : "warn",
    lacking: `Average response ${Math.round(ms)} ms. Full marks need 200 ms or less.`,
    steps,
  };
}

function sslFix(d: number | null): Omit<Fix, "gain" | "key"> {
  if (d == null) {
    return {
      title: "SSL certificate",
      tone: "warn",
      lacking: "We couldn't read the certificate's expiry date, so it counts as 70.",
      steps: ["Make sure the site answers over HTTPS on port 443 with a valid certificate.", "Run a check again; if it still fails, open SSL certificate Details for the error we got."],
    };
  }
  if (d > 30) {
    return {
      title: "SSL certificate",
      tone: "warn",
      lacking: `${d} days left on the certificate. Full marks at more than 60 days.`,
      steps: [
        "Certificates like Let's Encrypt renew about 30 days before expiry, so 31–60 days left is usually normal. No action needed if auto-renew is on.",
        "Confirm auto-renew is enabled in your host's SSL settings.",
      ],
    };
  }
  return {
    title: "SSL certificate",
    tone: d <= 14 ? "bad" : "warn",
    lacking: `Only ${d} days left on the certificate. Full marks at more than 60 days.`,
    steps: [
      d <= 14 ? "Renew it now: visitors will see a security warning when it expires." : "Auto-renew normally happens around now; if it hasn't in a few days, renew manually.",
      "Check your host's SSL settings (or certbot / your ACME client logs) for renewal errors.",
      "After renewing, install the full chain and run a check here to confirm the new date.",
    ],
  };
}

function domainFix(d: number | null, registrar?: string | null): Omit<Fix, "gain" | "key"> {
  const at = registrar ? `at ${registrar}` : "at your registrar";
  if (d == null) {
    return {
      title: "Domain",
      tone: "warn",
      lacking: "The registry didn't give us an expiry date, so it counts as 70.",
      steps: ["Some domain endings don't publish expiry dates. Nothing on your site needs fixing.", `Check the renewal date and auto-renew ${at} yourself.`],
    };
  }
  return {
    title: "Domain",
    tone: d <= 30 ? "bad" : "warn",
    lacking: `${d} days until the domain registration ends. Full marks at more than 90 days.`,
    steps: [
      d <= 30 ? `Renew it now ${at}: if it lapses, the site and email stop working.` : `Turn on auto-renew ${at}.`,
      "Renew for several years at once so you stay above 90 days.",
      "Keep the payment card on file with the registrar up to date.",
    ],
  };
}

/** Why the score isn't 100, ordered by points to gain. Uses the real scoring bands. */
export function healthFixes(i: HealthInput): { score: number; fixes: Fix[]; projected: number; perfect: boolean; tips: string[] } {
  const { score, parts } = healthScore(i);
  const build: Record<FixKey, () => Omit<Fix, "gain" | "key">> = {
    uptime: () => uptimeFix(i),
    latency: () => latencyFix(i.avgLatencyMs ?? 0),
    ssl: () => sslFix(i.sslDaysLeft),
    domain: () => domainFix(i.domainDaysLeft, i.registrar),
  };
  const fixes = ORDER.filter((k) => parts[k] < 100)
    .map((k): Fix => ({ key: k, gain: r1((100 - parts[k]) * HEALTH_WEIGHTS[k]), ...build[k]() }))
    .sort((a, b) => b.gain - a.gain || ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const projected = healthScore({ uptimePercent: 100, avgLatencyMs: 0, sslDaysLeft: 999, domainDaysLeft: 999 }).score;
  return {
    score,
    fixes,
    projected,
    perfect: fixes.length === 0,
    tips: fixes.length ? [] : ["Keep auto-renew on for both the SSL certificate and the domain.", "Glance at the response time chart after each deploy to catch slowdowns early."],
  };
}
