"use client";

import { formatDistanceToNowStrict } from "date-fns";
import type { TechItem } from "@/lib/tech-types";
import { TechChip } from "./TechChip";
import { formatWait, useTechStack } from "./useTechStack";

/**
 * "Tech stack" card, its own section below the site analytics. Independent of
 * Recheck / auto refresh: detects once automatically when nothing is stored,
 * then on "Recheck stack" (once per 24h per site). Hidden for locked sites.
 */
export function TechStackCard({ siteId, compact = false }: { siteId: string; compact?: boolean }) {
  const { status, data, detecting, error, waitMs, recheck } = useTechStack(siteId);
  if (status === "hidden") return null;

  const items = data?.items ?? [];
  const groups = new Map<string, TechItem[]>();
  for (const t of items) groups.set(t.category, [...(groups.get(t.category) ?? []), t]);
  const at = data?.detectedAt ? new Date(data.detectedAt) : null;
  const waiting = waitMs > 0;

  return (
    <section
      aria-busy={detecting || status === "loading" || undefined}
      className={`min-w-0 rounded-none border border-rule bg-surface ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium text-ink">Tech stack</h2>
          <p className="text-xs text-muted">
            {detecting
              ? "Detecting…"
              : at
                ? (
                  <span title={at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}>
                    Detected{" "}
                    {Date.now() - at.getTime() < 60_000
                      ? "just now"
                      : formatDistanceToNowStrict(at, { addSuffix: true })}
                  </span>
                )
                : "Frameworks, CMS, hosting, analytics and more"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void recheck()}
          disabled={detecting || waiting || status === "loading"}
          title={waiting ? "The tech stack can be rechecked once every 24 hours" : undefined}
          className="shrink-0 self-start rounded-none bg-solid px-3 py-1.5 text-xs font-medium tabular-nums text-solid-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {detecting ? "Detecting…" : waiting ? `Next recheck in ${formatWait(waitMs)}` : "Recheck stack"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 break-words text-sm text-danger">
          Couldn&apos;t detect the tech stack: {error}
        </p>
      )}

      <div className="mt-4">
        {status === "loading" || (detecting && items.length === 0) ? (
          <div className="flex flex-wrap gap-2" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-24 animate-pulse border border-rule bg-accent-soft/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">We couldn&apos;t detect any technologies yet.</p>
        ) : (
          <div className={`space-y-3 transition-opacity ${detecting ? "opacity-50" : ""}`}>
            {Array.from(groups, ([category, list]) => (
              <div key={category} className="min-w-0">
                <p className="label-caps text-muted">{category}</p>
                <ul className="mt-1.5 flex flex-wrap gap-2">
                  {list.map((t) => (
                    <li key={t.name} className="min-w-0 max-w-full">
                      <TechChip t={t} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        Fingerprints &amp; icons:{" "}
        <a
          href="https://github.com/enthec/webappanalyzer"
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-accent"
        >
          webappanalyzer
        </a>{" "}
        (GPL-3.0). Detected from the page&apos;s HTML and headers, so some tools may be missed.
      </p>
    </section>
  );
}
