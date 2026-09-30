/** What a site's home page returned, for tech detection. */
export type PageCapture = {
  url: string;
  status: number;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  setCookies: string[];
  html: string;
};

/** HTML read cap (bytes), body-read budget and request timeout. */
const MAX_HTML = 1_500_000;
const BODY_MS = 5000;
const REQUEST_MS = 12_000;

// A normal browser UA: some CDNs/WAFs block or strip pages for bot UAs.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Reads headers, cookies and up to MAX_HTML of an HTML body. Never throws. */
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
  return { url, status: res.status, headers, setCookies, html: html.slice(0, MAX_HTML) };
}

async function fetchOnce(url: string): Promise<PageCapture> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      cache: "no-store",
    });
    clearTimeout(timer);
    return await capturePage(res, res.url || url, controller);
  } finally {
    clearTimeout(timer);
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "the site took too long to respond";
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    return cause?.code || cause?.message || err.message;
  }
  return String(err);
}

/**
 * Fetch the site's home page (following redirects) with browser-like
 * headers. Falls back to the other of www/apex on network/TLS errors.
 * Throws an Error with a readable reason if the page can't be fetched.
 */
export async function fetchPage(siteUrl: string): Promise<PageCapture> {
  const u = new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`);
  const primary = `${u.protocol}//${u.host}/`;
  const host = u.hostname.toLowerCase();
  const alt = `${u.protocol}//${host.startsWith("www.") ? u.host.slice(4) : `www.${u.host}`}/`;
  try {
    return await fetchOnce(primary);
  } catch (first) {
    try {
      return await fetchOnce(alt);
    } catch {
      throw new Error(`Couldn't load ${u.host}: ${describe(first)}`);
    }
  }
}
