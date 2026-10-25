"use client";

import { healthFixes } from "@/lib/insights/health";
import { healthInput } from "@/lib/insights/sections";
import type { AnalyticsPayload } from "./analytics-types";
import { useOpenDetails } from "./details/DetailsContext";


/** The 2 biggest wins for the health score, each opening its Details panel. */
export function TopFixes({ data }: { data: AnalyticsPayload }) {
  const ctx = useOpenDetails();
  const h = healthFixes(healthInput(data));
  if (h.perfect) {
    return (
      <div className="flex items-center gap-3 border border-rule bg-surface px-4 py-3 text-sm">
        <span aria-hidden className="h-2 w-2 shrink-0 bg-emerald-500" />
        <p className="text-muted"><span className="font-medium text-ink">Perfect health score.</span> Nothing to fix right now.</p>
      </div>
    );
  }
  const top = h.fixes.slice(0, 2);
  return (
    <section aria-label="Top fixes" className="border border-rule bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
        <p className="label-caps text-muted">Top fixes</p>
        <p className="text-xs tabular-nums text-muted">{h.score} → {h.projected} if all fixed</p>
      </header>
      <ul className={`grid divide-y divide-rule sm:divide-x sm:divide-y-0${top.length > 1 ? " sm:grid-cols-2" : ""}`}>
        {top.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              onClick={() => ctx?.openFix(f.key)}
              aria-haspopup="dialog"
              className="flex h-full w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent-soft/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 ${f.tone === "bad" ? "bg-rose-500" : "bg-amber-500"}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
                  {f.title}
                  <span className="shrink-0 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25">+{f.gain} pts</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{f.lacking}</span>
                <span className="mt-1 block text-xs font-medium text-accent">How to fix →</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="flex justify-end border-t border-rule px-4 py-2">
        <button
          type="button"
          onClick={() => ctx?.openFix()}
          aria-haspopup="dialog"
          className="border border-rule px-2.5 py-1 text-xs font-medium text-ink hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          See all fixes ({h.fixes.length})
        </button>
      </footer>
    </section>
  );
}
