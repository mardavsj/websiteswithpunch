import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { WEBAPPANALYZER_CDN, WEBAPPANALYZER_COMMIT } from "./tech-types";

/**
 * Loads the webappanalyzer fingerprints (GPL-3.0 data, pinned commit) from
 * jsDelivr at runtime, caches them on disk (os.tmpdir) and in memory, and
 * compiles only the rules we can match without a browser: headers, cookies,
 * meta, html, scriptSrc, inline scripts, url, implies/excludes/requires.
 */

export type Pattern = { re: RegExp; version: string; confidence: number };
export type Rule = {
  name: string;
  cats: number[];
  icon: string;
  website: string | null;
  headers: Array<[string, Pattern[]]>;
  cookies: Array<[string, Pattern[]]>;
  meta: Array<[string, Pattern[]]>;
  html: Pattern[];
  scriptSrc: Pattern[];
  scripts: Pattern[];
  url: Pattern[];
  implies: Array<{ name: string; confidence: number }>;
  excludes: string[];
  requires: string[];
  requiresCategory: number[];
};
export type Fingerprints = {
  rules: Map<string, Rule>;
  categories: Map<number, { name: string; priority: number }>;
};

type Raw = { technologies: Record<string, Record<string, unknown>>; categories: Record<string, { name: string; priority: number }> };

const FILES = ["_", ..."abcdefghijklmnopqrstuvwxyz".split("")];
const CACHE_FILE = path.join(os.tmpdir(), `wwp-webappanalyzer-${WEBAPPANALYZER_COMMIT}.json`);
const LOAD_MS = 15_000;
const RETRY_MS = 10 * 60_000;

const arr = (v: unknown): string[] =>
  v == null ? [] : (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === "string");

export function parsePattern(src: string): Pattern | null {
  const [body, ...attrs] = src.split("\\;");
  let version = "";
  let confidence = 100;
  for (const a of attrs) {
    if (a.startsWith("version:")) version = a.slice(8);
    else if (a.startsWith("confidence:")) confidence = Number(a.slice(11)) || 0;
  }
  try {
    return { re: new RegExp(body, "i"), version, confidence };
  } catch {
    return null; // pattern uses syntax JS can't compile: skip it
  }
}

const patterns = (v: unknown): Pattern[] =>
  arr(v).map(parsePattern).filter((p): p is Pattern => p != null);

const keyed = (v: unknown, lower: boolean): Array<[string, Pattern[]]> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.entries(v as Record<string, unknown>).map(([k, p]) => [
        lower ? k.toLowerCase() : k,
        patterns(p === "" ? [""] : p),
      ])
    : [];

function compile(raw: Raw): Fingerprints {
  const rules = new Map<string, Rule>();
  for (const [name, t] of Object.entries(raw.technologies)) {
    rules.set(name, {
      name,
      cats: Array.isArray(t.cats) ? (t.cats as number[]) : [],
      icon: typeof t.icon === "string" ? t.icon : "default.svg",
      website: typeof t.website === "string" ? t.website : null,
      headers: keyed(t.headers, true),
      cookies: keyed(t.cookies, false),
      meta: keyed(t.meta, true),
      html: patterns(t.html),
      scriptSrc: patterns(t.scriptSrc),
      scripts: patterns(t.scripts),
      url: patterns(t.url),
      implies: arr(t.implies).map((s) => {
        const [n, ...attrs] = s.split("\\;");
        const c = attrs.find((a) => a.startsWith("confidence:"));
        return { name: n, confidence: c ? Number(c.slice(11)) || 0 : 100 };
      }),
      excludes: arr(t.excludes),
      requires: arr(t.requires),
      requiresCategory: (Array.isArray(t.requiresCategory) ? t.requiresCategory : [t.requiresCategory])
        .filter((n): n is number => typeof n === "number"),
    });
  }
  const categories = new Map<number, { name: string; priority: number }>();
  for (const [id, c] of Object.entries(raw.categories)) {
    categories.set(Number(id), { name: c.name, priority: c.priority ?? 9 });
  }
  return { rules, categories };
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function loadRaw(): Promise<Raw> {
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE, "utf8")) as Raw;
  } catch {
    /* not cached yet */
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LOAD_MS);
  try {
    const [categories, ...parts] = await Promise.all([
      getJson(`${WEBAPPANALYZER_CDN}/categories.json`, ctrl.signal),
      ...FILES.map((f) => getJson(`${WEBAPPANALYZER_CDN}/technologies/${f}.json`, ctrl.signal)),
    ]);
    const raw: Raw = {
      categories: categories as Raw["categories"],
      technologies: Object.assign({}, ...(parts as Array<Raw["technologies"]>)),
    };
    const tmp = `${CACHE_FILE}.${process.pid}.tmp`; // write + rename: never a half file
    await fs
      .writeFile(tmp, JSON.stringify(raw))
      .then(() => fs.rename(tmp, CACHE_FILE))
      .catch(() => undefined);
    return raw;
  } finally {
    clearTimeout(timer);
  }
}

let cached: Promise<Fingerprints> | null = null;
let failedAt = 0;

/** Compiled fingerprints, or null if they can't be loaded right now. */
export async function getFingerprints(): Promise<Fingerprints | null> {
  if (!cached) {
    if (Date.now() - failedAt < RETRY_MS) return null;
    cached = loadRaw().then(compile);
    cached.catch(() => {
      cached = null;
      failedAt = Date.now();
    });
  }
  return cached.catch(() => null);
}
