import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { WEBAPPANALYZER_CDN, WEBAPPANALYZER_COMMIT, WEBAPPANALYZER_RAW } from "./tech-types";

/**
 * Loads the webappanalyzer fingerprints (GPL-3.0 data, pinned commit) at
 * runtime from jsDelivr (fallback: raw.githubusercontent.com), caches them in
 * memory and, best effort, on disk (.next/cache, then the OS temp dir), and
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
const CACHE_NAME = `wwp-webappanalyzer-${WEBAPPANALYZER_COMMIT}.json`;
const SOURCES = [WEBAPPANALYZER_CDN, WEBAPPANALYZER_RAW];
const FILE_MS = 30_000; // per file; the first load downloads ~3.3MB
const ATTEMPTS = 2; // per source
const RETRY_MS = 30_000; // after a failed load, wait this long before trying again

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

function cacheFiles(): string[] {
  const dirs = [path.join(process.cwd(), ".next", "cache"), os.tmpdir()];
  return dirs.map((d) => path.join(d, CACHE_NAME));
}

const valid = (raw: Raw | null): raw is Raw =>
  Boolean(raw?.technologies && raw.categories && Object.keys(raw.technologies).length > 1000);

async function readCache(): Promise<Raw | null> {
  for (const file of cacheFiles()) {
    try {
      const raw = JSON.parse(await fs.readFile(file, "utf8")) as Raw;
      if (valid(raw)) return raw;
    } catch {
      /* missing or unreadable: try the next one */
    }
  }
  return null;
}

/** Best effort: a failed write (permissions, OneDrive, read-only) just means memory-only. */
async function writeCache(raw: Raw): Promise<void> {
  const text = JSON.stringify(raw);
  for (const file of cacheFiles()) {
    const tmp = `${file}.${process.pid}.tmp`; // write + rename: never a half file
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(tmp, text);
      await fs.rename(tmp, file);
      return;
    } catch (err) {
      await fs.unlink(tmp).catch(() => undefined);
      console.warn(`[tech-stack] Couldn't cache fingerprints at ${file}:`, (err as Error).message);
    }
  }
}

async function getJsonOnce(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FILE_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    throw new Error(e.name === "AbortError" ? "timed out" : e.cause?.code || e.message);
  } finally {
    clearTimeout(timer);
  }
}

/** One file, trying each source ATTEMPTS times. */
async function getJson(file: string): Promise<unknown> {
  const errors: string[] = [];
  for (const base of SOURCES) {
    for (let i = 0; i < ATTEMPTS; i++) {
      try {
        return await getJsonOnce(`${base}/${file}`);
      } catch (err) {
        errors.push(`${new URL(base).host}: ${(err as Error).message}`);
      }
    }
  }
  throw new Error(`${file} (${errors.join("; ")})`);
}

async function loadRaw(): Promise<Raw> {
  const cached = await readCache();
  if (cached) return cached;
  const started = Date.now();
  const [categories, ...parts] = await Promise.all([
    getJson("categories.json"),
    ...FILES.map((f) => getJson(`technologies/${f}.json`)),
  ]);
  const raw: Raw = {
    categories: categories as Raw["categories"],
    technologies: Object.assign({}, ...(parts as Array<Raw["technologies"]>)),
  };
  if (!valid(raw)) throw new Error("fingerprint data looks incomplete");
  console.info(
    `[tech-stack] Downloaded ${Object.keys(raw.technologies).length} fingerprints in ${Date.now() - started}ms`
  );
  await writeCache(raw);
  return raw;
}

let cached: Promise<Fingerprints> | null = null;
let failed: { at: number; message: string } | null = null;

/** Compiled fingerprints. Throws a readable Error if they can't be loaded. */
export async function getFingerprints(): Promise<Fingerprints> {
  if (!cached) {
    if (failed && Date.now() - failed.at < RETRY_MS) throw new Error(failed.message);
    cached = loadRaw().then(compile);
    cached.catch((err: Error) => {
      cached = null;
      failed = { at: Date.now(), message: `Couldn't download the technology fingerprints: ${err.message}` };
      console.error("[tech-stack]", failed.message);
    });
  }
  try {
    return await cached;
  } catch {
    throw new Error(failed?.message ?? "Couldn't load the technology fingerprints");
  }
}
