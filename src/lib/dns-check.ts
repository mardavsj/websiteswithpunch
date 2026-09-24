import dns from "node:dns/promises";

export type DnsCheckResult =
  | { ok: true }
  | { ok: false; code: "DOMAIN_NOT_FOUND"; host: string };

const NONEXISTENT = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

type Probe = "found" | "not_found" | "error";

function errCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: string }).code);
  }
  return undefined;
}

/** Try A / AAAA / CNAME / lookup for one hostname. */
async function probeHost(host: string): Promise<Probe> {
  const attempts: Array<() => Promise<unknown>> = [
    () => dns.resolve4(host),
    () => dns.resolve6(host),
    () => dns.resolveCname(host),
    () => dns.lookup(host, { all: true }),
  ];

  let sawNotFound = false;
  let sawOther = false;

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (Array.isArray(result)) {
        if (result.length > 0) return "found";
      } else if (result) {
        return "found";
      }
    } catch (err) {
      const code = errCode(err);
      if (code && NONEXISTENT.has(code)) {
        sawNotFound = true;
        continue;
      }
      sawOther = true;
    }
  }

  if (sawOther) return "error";
  if (sawNotFound) return "not_found";
  return "not_found";
}

/**
 * Server-only DNS existence check.
 * Blocks only on definitive nonexistence for hostname and www/apex variant.
 * Timeouts / SERVFAIL / other errors → allow (caller should log).
 */
export async function assertHostnameResolves(hostname: string): Promise<DnsCheckResult> {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const variants = [host];
  if (!host.startsWith("www.")) variants.push(`www.${host}`);

  const timeoutMs = 3000;
  let timedOut = false;

  const work = Promise.all(variants.map((h) => probeHost(h))).then((results) => {
    if (results.some((r) => r === "found")) return { ok: true as const };
    if (results.every((r) => r === "not_found")) {
      return { ok: false as const, code: "DOMAIN_NOT_FOUND" as const, host };
    }
    // Mixed not_found + error → inconclusive → allow
    console.warn("[dns-check] inconclusive for", host, results);
    return { ok: true as const };
  });

  const result = await Promise.race([
    work,
    new Promise<DnsCheckResult>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        console.warn("[dns-check] timeout for", host);
        resolve({ ok: true });
      }, timeoutMs);
    }),
  ]);

  if (timedOut) return { ok: true };
  return result;
}
