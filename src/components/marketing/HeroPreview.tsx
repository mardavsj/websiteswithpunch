"use client";

import { useEffect, useState } from "react";
import { daysTone, heroSites, type HeroSite } from "./hero-sites";
import { HeroSparkline } from "./HeroSparkline";

const TICK_MS = 1100;

/** Cycles a "checking…" state through the rows; static when reduced motion is on. */
function useCheckingRow(count: number) {
  const [tick, setTick] = useState(-1);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % (count * 2)), TICK_MS);
    return () => window.clearInterval(id);
  }, [count]);
  return tick >= 0 && tick % 2 === 0 ? Math.floor(tick / 2) : -1;
}

function Status({ site, checking }: { site: HeroSite; checking: boolean }) {
  const tone = site.up
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30"
    : "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/30";
  return (
    <span className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${site.up ? "bg-emerald-500" : "bg-rose-500"}`} />
        {site.up ? "Up" : "Down"}
      </span>
      <span className="w-[4.5rem] whitespace-nowrap text-[11px] tabular-nums text-muted">
        {checking ? (
          <span className="text-accent">checking…</span>
        ) : site.up ? (
          site.reading
        ) : (
          `HTTP ${site.reading}`
        )}
      </span>
    </span>
  );
}

function Days({ label, days }: { label: string; days: number }) {
  return (
    <span className={`inline-flex items-baseline gap-1 px-1.5 py-0.5 text-[11px] tabular-nums ring-1 ring-inset ${daysTone(days)}`}>
      <span className="text-muted sm:hidden">{label}</span>
      <span className="font-semibold">{days}</span>d
    </span>
  );
}

export function HeroPreview() {
  const checking = useCheckingRow(heroSites.length);

  return (
    <div className="relative">
      <div className="border border-rule bg-surface shadow-[8px_8px_0_0_hsl(var(--accent)/0.18)]">
        <div className="flex items-center gap-2 border-b border-rule px-4 py-3 sm:px-5">
          <span className="h-2 w-2 bg-accent" />
          <span className="font-display text-sm font-medium text-ink">Sites</span>
          <span className="text-[11px] text-muted">4 monitored</span>
          <span className="ml-2 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1.2fr)_2.75rem_2.75rem] gap-4 border-b border-rule px-5 py-2 lg:grid-cols-[minmax(0,1.2fr)_4.5rem_minmax(0,0.8fr)_2.5rem_2.75rem] lg:gap-3 lg:px-4 text-[10px] uppercase tracking-wider text-muted sm:grid">
          <span>Site</span>
          <span>Status</span>
          <span className="whitespace-nowrap">
            Response<span className="lg:hidden"> time</span>
          </span>
          <span>SSL</span>
          <span>Domain</span>
        </div>

        <ul>
          {heroSites.map((s, i) => (
            <li
              key={s.host}
              className={`relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b border-rule px-4 py-3 transition-colors duration-500 last:border-b-0 motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1.2fr)_2.75rem_2.75rem] sm:items-center sm:gap-4 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_4.5rem_minmax(0,0.8fr)_2.5rem_2.75rem] lg:gap-3 lg:px-4 ${
                checking === i ? "bg-accent-soft" : ""
              }`}
            >
              <span className={`absolute inset-y-0 left-0 w-0.5 bg-accent transition-opacity duration-500 motion-reduce:transition-none ${checking === i ? "opacity-100" : "opacity-0"}`} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                <span className="block truncate text-[11px] text-accent">{s.host}</span>
              </span>
              <Status site={s} checking={checking === i} />
              <HeroSparkline site={s} />
              <span className="col-span-2 flex gap-1.5 sm:contents">
                <Days label="SSL" days={s.ssl} />
                <Days label="Domain" days={s.domain} />
              </span>
            </li>
          ))}
        </ul>
        {/* On lg+ the floating cards sit over this strip, so its label is hidden there. */}
        <div className="flex justify-end border-t border-rule px-4 py-2.5 text-[11px] text-muted sm:px-5">
          <span className="lg:invisible">Last check · just now</span>
        </div>
      </div>
    </div>
  );
}
