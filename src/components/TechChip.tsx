"use client";

import { useState } from "react";
import { techIconUrl, type TechItem } from "@/lib/tech-types";

/** One technology: logo tile + name (+ version), linking to its website. */
export function TechChip({ t }: { t: TechItem }) {
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
