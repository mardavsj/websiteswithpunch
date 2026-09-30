import type { PageCapture } from "./page-capture";
import { getFingerprints, type Fingerprints, type Pattern, type Rule } from "./tech-fingerprints";
import type { TechItem } from "./tech-types";

/**
 * Server-side, browser-free tech detection (Wappalyzer-style) on the page the
 * detector fetched (see page-capture). Rules needing JS execution or a DOM
 * are skipped. Matching takes ~0.1–0.5s once the fingerprints are loaded.
 */

const HTML_MATCH_CHARS = 600_000;
const MAX_ITEMS = 40;

type Page = {
  url: string;
  headers: Record<string, string>;
  cookies: Map<string, string>;
  meta: Map<string, string>;
  html: string;
  scriptSrc: string[];
  scripts: string;
};

const ATTR = (tag: string, name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag)?.slice(2).find((v) => v != null) ?? null;

function parsePage(p: PageCapture): Page {
  const html = p.html.length > HTML_MATCH_CHARS ? p.html.slice(0, HTML_MATCH_CHARS) : p.html;
  const cookies = new Map<string, string>();
  for (const c of p.setCookies) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  const meta = new Map<string, string>();
  for (const [tag] of Array.from(html.matchAll(/<meta\b[^>]*>/gi))) {
    const key = ATTR(tag, "name") ?? ATTR(tag, "property") ?? ATTR(tag, "http-equiv");
    const content = ATTR(tag, "content");
    if (key && content != null) meta.set(key.toLowerCase(), content);
  }
  const scriptSrc: string[] = [];
  let scripts = "";
  for (const m of Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))) {
    const src = ATTR(m[1], "src");
    if (src) scriptSrc.push(src);
    else if (scripts.length < 200_000) scripts += `${m[2]}\n`;
  }
  return { url: p.url, headers: p.headers, cookies, meta, html, scriptSrc, scripts };
}

/** Wappalyzer's version template: \1 back-references and \1?a:b ternaries. */
function resolveVersion(template: string, m: RegExpExecArray): string {
  let v = template;
  m.forEach((g, i) => {
    const t = new RegExp(`\\\\${i}\\?([^:]+):(.*)$`).exec(v);
    if (t) v = v.replace(t[0], g ? t[1] : t[2]);
    v = v.trim().replace(new RegExp(`\\\\${i}`, "g"), g || "");
  });
  return /^[\w.\-+]{1,20}$/.test(v) && /\d/.test(v) ? v : "";
}

type Hit = { confidence: number; version: string };

function test(list: Pattern[], values: string[], hit: (p: Pattern, m: RegExpExecArray) => void) {
  for (const p of list) {
    for (const v of values) {
      const m = p.re.exec(v);
      if (m) {
        hit(p, m);
        break;
      }
    }
  }
}

function matchRule(r: Rule, page: Page): Hit | null {
  let confidence = 0;
  let version = "";
  const hit = (p: Pattern, m: RegExpExecArray) => {
    confidence += p.confidence;
    const v = p.version ? resolveVersion(p.version, m) : "";
    if (v.length > version.length) version = v;
  };
  for (const [k, ps] of r.headers) if (page.headers[k] != null) test(ps, [page.headers[k]], hit);
  for (const [k, ps] of r.cookies) if (page.cookies.has(k)) test(ps, [page.cookies.get(k)!], hit);
  for (const [k, ps] of r.meta) if (page.meta.has(k)) test(ps, [page.meta.get(k)!], hit);
  if (r.url.length) test(r.url, [page.url], hit);
  if (r.scriptSrc.length && page.scriptSrc.length) test(r.scriptSrc, page.scriptSrc, hit);
  if (r.scripts.length && page.scripts) test(r.scripts, [page.scripts], hit);
  if (r.html.length && page.html) test(r.html, [page.html], hit);
  return confidence > 0 ? { confidence: Math.min(100, confidence), version } : null;
}

function analyze(fp: Fingerprints, page: Page): TechItem[] {
  const found = new Map<string, Hit>();
  fp.rules.forEach((r) => {
    const h = matchRule(r, page);
    if (h) found.set(r.name, h);
  });
  // implies (transitive)
  const queue = Array.from(found.keys());
  while (queue.length) {
    const r = fp.rules.get(queue.shift()!);
    for (const imp of r?.implies ?? []) {
      if (!found.has(imp.name) && fp.rules.has(imp.name)) {
        found.set(imp.name, { confidence: imp.confidence, version: "" });
        queue.push(imp.name);
      }
    }
  }
  // excludes, requires, requiresCategory
  for (const name of Array.from(found.keys())) {
    for (const ex of fp.rules.get(name)?.excludes ?? []) found.delete(ex);
  }
  const catsFound = new Set<number>();
  found.forEach((_, n) => fp.rules.get(n)?.cats.forEach((c) => catsFound.add(c)));
  for (const name of Array.from(found.keys())) {
    const r = fp.rules.get(name)!;
    if (r.requires.some((q) => !found.has(q)) || r.requiresCategory.some((c) => !catsFound.has(c))) {
      found.delete(name);
    }
  }

  const items: TechItem[] = [];
  found.forEach((h, name) => {
    if (h.confidence < 50) return;
    const r = fp.rules.get(name)!;
    const cat = fp.categories.get(r.cats[0]) ?? { name: "Other", priority: 9 };
    items.push({
      name,
      version: h.version || null,
      icon: r.icon,
      website: r.website,
      category: cat.name,
      priority: cat.priority,
      confidence: h.confidence,
    });
  });
  items.sort((a, b) => a.priority - b.priority || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return items.slice(0, MAX_ITEMS);
}

/**
 * Detect technologies on a fetched page. Throws a readable Error when the
 * fingerprints can't be loaded; an empty array means nothing was recognised.
 */
export async function detectTech(capture: PageCapture): Promise<TechItem[]> {
  const fp = await getFingerprints();
  return analyze(fp, parsePage(capture));
}
