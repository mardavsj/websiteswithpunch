"use client";

import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { techIconUrl, type TechItem } from "@/lib/tech-types";

export type TechPayload = { items: TechItem[] | null; detectedAt: string | null };

function TechChip({ t }: { t: TechItem }) {
  const [broken, setBroken] = useState(false);
  const label = t.version ? `${t.name} ${t.version}` : t.name;
  const body = (
    <>
      {/* White tile keeps dark logos visible in dark mode. */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-white p-0.5">
        {broken ? (
          <span aria-hidden className="text-[10px] font-semibold text-neutral-700">
            {t.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- remote SVG/PNG icons from a pinned CDN
          <img
            src={techIconUrl(t.icon)}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            decoding="async"
            className="h-4 w-4 object-contain"
            onError={() => setBroken(true)}
          />
        )}
      </span>
      <span className="min-w-0 truncate">{t.name}</span>
      {t.version && <span className="shrink-0 tabular-nums text-muted">{t.version}</span>}
    </>
  );
  const cls =
    "inline-flex max-w-full items-center gap-1.5 border border-rule bg-bg px-2 py-1 text-xs font-medium text-ink";
  return t.website ? (
    <a
      href={t.website}
      target="_blank"
      rel="noreferrer noopener"
      title={t.confidence < 100 ? `${label} (${t.confidence}% confidence)` : label}
      className={`${cls} hover:bg-accent-soft`}
    >
      {body}
    </a>
  ) : (
    <span title={label} className={cls}>
      {body}
    </span>
  );
}

/** "Tech stack" card: detected technologies grouped by category. */
export function TechStackCard({ tech }: { tech?: TechPayload | null }) {
  const items = tech?.items ?? [];
  const groups = new Map<string, TechItem[]>();
  for (const t of items) groups.set(t.category, [...(groups.get(t.category) ?? []), t]);
  const at = tech?.detectedAt ? new Date(tech.detectedAt) : null;

  return (
    <div className="min-w-0 border border-rule bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-display text-sm font-medium text-ink">Tech stack</p>
        {at && (
          <p className="text-xs text-muted" title={at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}>
            Detected {formatDistanceToNowStrict(at, { addSuffix: true })}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          We couldn&apos;t detect any technologies yet.
          {!at && " They're detected when the site is added, on Recheck and once a day."}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
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

      <p className="mt-3 text-[11px] text-muted">
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
    </div>
  );
}
