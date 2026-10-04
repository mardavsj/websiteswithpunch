import http from "node:http";
import https from "node:https";
import { BlockedTargetError, assertSafeUrl, guardedLookup } from "./net-guard";

const UA = "WebsitesWithPunch-Monitor/1.0 (+https://www.websiteswithpunch.com)";

export type ProbeResponse = { status: number; location: string | null };

/**
 * One GET to a user-supplied URL with the SSRF guard on the socket's DNS lookup. Resolves as soon
 * as the status line and headers arrive; the body is never read (the socket is destroyed), so a
 * huge or endless response costs nothing. Redirects are NOT followed here.
 */
export function probeOnce(raw: string, timeoutMs: number): Promise<ProbeResponse> {
  return new Promise((resolve, reject) => {
    let url: URL;
    try {
      url = assertSafeUrl(raw);
    } catch (err) {
      return reject(err);
    }
    const mod = url.protocol === "https:" ? https : http;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn();
    };
    const req = mod.request(
      url,
      {
        method: "GET",
        agent: false,
        lookup: guardedLookup as never,
        headers: { "User-Agent": UA, Accept: "*/*", Connection: "close" },
        maxHeaderSize: 32 * 1024,
      },
      (res) => {
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const status = res.statusCode ?? 0;
        res.destroy();
        req.destroy();
        finish(() => resolve({ status, location }));
      },
    );
    const timer = setTimeout(() => {
      req.destroy(Object.assign(new Error("Timed out"), { code: "ETIMEDOUT" }));
    }, timeoutMs);
    req.on("error", (err) => finish(() => reject(err)));
    req.end();
  });
}

/** Short, user-safe text for a failed request (stored with the check and shown in analytics). */
export function describeRequestError(err: unknown): string {
  if (err instanceof BlockedTargetError) return err.message;
  const e = err as { code?: string; message?: string };
  const code = e?.code || "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "DNS lookup failed";
  if (code === "ECONNREFUSED") return "Connection refused";
  if (code === "ECONNRESET" || code === "EPIPE") return "Connection reset";
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") return "Timed out";
  if (code === "EHOSTUNREACH" || code === "ENETUNREACH") return "Host unreachable";
  if (/CERT|SSL|TLS|SELF_SIGNED|ERR_TLS/i.test(code) || /certificate|altname/i.test(e?.message || "")) {
    return `TLS certificate error${code ? ` (${code})` : ""}`;
  }
  if (code === "HPE_HEADER_OVERFLOW") return "Response headers too large";
  return "Request failed";
}

/** Read a response body as text, giving up past `max` bytes (cancels the rest). */
export async function readCapped(res: Response, max = 1024 * 1024): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      throw new Error("Response too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

