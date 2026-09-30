/** What the uptime fetch saw at the final URL, for tech detection. */
export type PageCapture = {
  url: string;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  setCookies: string[];
  html: string;
};

/** HTML read cap (bytes) and body-read time budget. */
const MAX_HTML = 1_500_000;
const BODY_MS = 4000;

/**
 * Reads headers, cookies and up to MAX_HTML of an HTML body. Never throws:
 * a partial or empty body is fine (detection just finds less).
 */
export async function capturePage(
  res: Response,
  url: string,
  controller: AbortController
): Promise<PageCapture> {
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  const one = res.headers.get("set-cookie");
  const setCookies = typeof h.getSetCookie === "function" ? h.getSetCookie() : one ? [one] : [];

  let html = "";
  const type = headers["content-type"] || "";
  if (!type || /html|xml/i.test(type)) {
    const timer = setTimeout(() => controller.abort(), BODY_MS);
    try {
      const reader = res.body?.getReader();
      if (reader) {
        const dec = new TextDecoder();
        let size = 0;
        while (size < MAX_HTML) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          html += dec.decode(value, { stream: true });
        }
        reader.cancel().catch(() => undefined);
      }
    } catch {
      /* partial HTML is fine */
    } finally {
      clearTimeout(timer);
    }
  } else {
    res.body?.cancel().catch(() => undefined);
  }
  return { url, headers, setCookies, html: html.slice(0, MAX_HTML) };
}
