import { checkDomainExpiry } from "@/lib/checks-domain";
import { runTool } from "@/lib/tools/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tools/domain?q=example.com: registrar and expiry from RDAP (WHOIS fallback), cached 1 h. */
export function GET(req: Request) {
  return runTool(req, "domain", 3600, async (t) => {
    const r = await checkDomainExpiry(`https://${t.domain}`);
    return {
      ok: Boolean(r.expiresAt),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      daysLeft: r.daysLeft,
      registrar: r.registrar ?? null,
      registeredAt: r.registeredAt?.toISOString() ?? null,
      source: r.expiresAt ? (r.registrar !== undefined ? "RDAP" : "WHOIS") : null,
      error: r.expiresAt
        ? null
        : "This registry didn't publish an expiry date we could read. Some country-code domains (for example .io or .de) don't share it publicly.",
    };
  });
}
