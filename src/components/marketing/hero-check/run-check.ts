import { normalizeSiteUrl, SiteUrlError } from "@/lib/url";

/** One homepage check, shaped like the dashboard's site record. Unknown values stay null. */
export type HeroCheck = {
  host: string;
  /** Registrable domain, handed to signup so the site can be added after. */
  domain: string;
  url: string;
  status: "up" | "down" | "error";
  checkedAt: string;
  latencyMs: number | null;
  statusCode: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
  /** Why the site is down or the check failed, in plain English. */
  message: string | null;
};

/** The check couldn't run: invalid or blocked input (400) or the tools rate limit (429). */
export class CheckError extends Error {
  constructor(
    message: string,
    public kind: "invalid" | "limited",
    public retryAfter = 0,
  ) {
    super(message);
    this.name = "CheckError";
  }
}

/** Same rules as adding a site (no IPs, localhost or unknown suffixes); the API checks again. */
export function validateSite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Enter a website, e.g. example.com.";
  try {
    normalizeSiteUrl(v);
    return null;
  } catch (e) {
    return e instanceof SiteUrlError ? e.message : "Enter a valid website, e.g. example.com.";
  }
}

const TIMEOUT_MS = 30_000;
type Reply = { status: number; data: Record<string, unknown>; retryAfter: number };

async function call(tool: "down" | "ssl" | "domain", q: string, signal: AbortSignal): Promise<Reply> {
  const res = await fetch(`/api/tools/${tool}?q=${encodeURIComponent(q)}`, { signal });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const retryAfter = Number(data.retryAfter ?? res.headers.get("Retry-After") ?? 0) || 0;
  return { status: res.status, data, retryAfter };
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const text = (v: unknown) => (typeof v === "string" && v ? v : null);

/**
 * Runs the public down, SSL and domain checks in parallel (each one goes through the tools API's
 * SSRF guard and per-IP rate limit). Throws CheckError for 400/429; any other failure or a
 * timeout comes back as an "error" result with a reason, never made-up numbers.
 */
export async function runCheck(raw: string): Promise<HeroCheck> {
  const q = raw.trim();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const [down, ssl, domain] = await Promise.allSettled([
    call("down", q, ctrl.signal),
    call("ssl", q, ctrl.signal),
    call("domain", q, ctrl.signal),
  ]).finally(() => clearTimeout(timer));

  const replies = [down, ssl, domain].flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const limited = replies.find((r) => r.status === 429);
  if (limited) {
    const s = Math.max(1, limited.retryAfter);
    throw new CheckError(
      `You've run a lot of checks. Please try again in ${s < 120 ? `${s}s` : `${Math.ceil(s / 60)} min`}.`,
      "limited",
      s,
    );
  }
  const bad = replies.find((r) => r.status === 400);
  if (bad) throw new CheckError(text(bad.data.error) ?? "Enter a valid website, e.g. example.com.", "invalid");

  const ok = (r: PromiseSettledResult<Reply>) => (r.status === "fulfilled" && r.value.status === 200 ? r.value.data : null);
  const d = ok(down);
  const s = ok(ssl);
  const m = ok(domain);
  const host = text(d?.host) ?? text(s?.host) ?? q.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase();
  const status = d?.status === "up" || d?.status === "down" ? d.status : "error";
  const timedOut = down.status === "rejected" && ctrl.signal.aborted;
  const code = num(d?.statusCode);

  return {
    host,
    domain: text(d?.domain) ?? text(m?.domain) ?? host.replace(/^www\./, ""),
    url: `https://${host}`,
    status,
    checkedAt: text(d?.checkedAt) ?? new Date().toISOString(),
    // Only a real HTTP answer has a response time (a refused or blocked request has none).
    latencyMs: code != null ? num(d?.latencyMs) : null,
    statusCode: code,
    sslDaysLeft: s?.ok ? num(s.daysLeft) : null,
    domainDaysLeft: m?.ok ? num(m.daysLeft) : null,
    message: d
      ? text(d.error) ?? (status === "down" && code ? `The site answered with HTTP ${code}.` : null)
      : timedOut
        ? "The check took too long. The site may be down or very slow; try again in a minute."
        : "The check couldn't run. Check your connection and try again.",
  };
}
