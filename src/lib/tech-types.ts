/**
 * Tech stack types + icon URLs, safe to import on the client.
 *
 * Fingerprints and icons come from the open-source webappanalyzer project
 * (https://github.com/enthec/webappanalyzer, GPL-3.0), pinned to one commit.
 * They are loaded at runtime on the server and never bundled or shipped.
 */

export const WEBAPPANALYZER_COMMIT = "eea872af449e207e055398f7369d11ee48c8ea03";
export const WEBAPPANALYZER_CDN = `https://cdn.jsdelivr.net/gh/enthec/webappanalyzer@${WEBAPPANALYZER_COMMIT}/src`;

export type TechItem = {
  name: string;
  version: string | null;
  /** Icon file name inside src/images/icons (e.g. "React.svg"). */
  icon: string;
  website: string | null;
  /** Primary category name, e.g. "JavaScript frameworks". */
  category: string;
  /** Lower = more important (from categories.json). */
  priority: number;
  confidence: number;
};

export function techIconUrl(icon: string | null | undefined): string {
  return `${WEBAPPANALYZER_CDN}/images/icons/${encodeURIComponent(icon || "default.svg")}`;
}

/** Parse the stored JSON (Site.techStack); tolerates bad/missing data. */
export function parseTechStack(raw: string | null | undefined): TechItem[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as TechItem[]) : null;
  } catch {
    return null;
  }
}
