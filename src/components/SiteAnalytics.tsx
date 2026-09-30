"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { lockedRangeNotice, type RangeKey } from "@/lib/analytics";
import { SiteAnalyticsBody, type AnalyticsPayload } from "./SiteAnalyticsBody";
import { EmptyHistory, StaleBanner } from "./AnalyticsNotices";
import { onSiteChecked, recheckSite } from "@/lib/site-check-client";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "All" },
];

export function SiteAnalytics({
  siteId,
  compact = false,
}: {
  siteId: string;
  compact?: boolean;
}) {
  // First fetch uses 24h (always unlocked once site exists); API clamps if needed.
  const [range, setRange] = useState<RangeKey>("24h");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(true);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const router = useRouter();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockedRanges: RangeKey[] = data?.unlockedRanges?.length
    ? data.unlockedRanges
    : ["24h"];
  const ageDays = data?.ageDays ?? 0;

  const clearNotice = useCallback(() => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    setLockNotice(null);
  }, []);

  const showLockNotice = useCallback(
    (locked: RangeKey) => {
      const msg = lockedRangeNotice(ageDays, locked);
      setLockNotice(msg);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => {
        setLockNotice(null);
        noticeTimer.current = null;
      }, 6000);
    },
    [ageDays]
  );

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const load = useCallback(
    async (r: RangeKey) => {
      setLoading(true);
      setError(null);
      setFade(false);
      try {
        const res = await fetch(
          `/api/sites/${siteId}/analytics?range=${encodeURIComponent(r)}&_=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || "Could not load analytics");
        }
        const json = (await res.json()) as AnalyticsPayload;
        setData(json);
        setRange(json.range);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        requestAnimationFrame(() => setFade(true));
      }
    },
    [siteId]
  );

  useEffect(() => {
    void load("24h");
    // intentionally only on mount / site change — range changes call load directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, load]);

  function selectRange(next: RangeKey) {
    const isUnlocked = unlockedRanges.includes(next);
    if (!isUnlocked) {
      showLockNotice(next);
      return;
    }
    clearNotice();
    if (next === range && !loading) {
      void load(next);
      return;
    }
    setRange(next);
    void load(next);
  }

  const rangeRef = useRef<RangeKey>(range);
  rangeRef.current = range;

  // Any successful Recheck (site card or banner) → refetch analytics in place.
  useEffect(
    () => onSiteChecked(siteId, () => void load(rangeRef.current)),
    [siteId, load]
  );

  async function recheck() {
    setChecking(true);
    setCheckError(null);
    try {
      await recheckSite(siteId);
      router.refresh();
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "Recheck failed. Try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section
      className={`min-w-0 rounded-none border border-rule bg-surface ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Site analytics</h2>
          <p className="text-xs text-muted">
            Built from real checks — uptime, latency, incidents, SSL & domain risk.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-rule">
            {RANGES.map((r) => {
              const locked = !unlockedRanges.includes(r.key);
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => selectRange(r.key)}
                  aria-disabled={locked || undefined}
                  title={
                    locked
                      ? lockedRangeNotice(ageDays, r.key)
                      : undefined
                  }
                  className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    locked
                      ? "cursor-not-allowed bg-bg text-muted opacity-40"
                      : active
                        ? "bg-solid text-solid-fg"
                        : "bg-bg text-muted hover:bg-accent-soft hover:text-ink"
                  } ${loading && active && !locked ? "opacity-70" : ""}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              clearNotice();
              void load(range);
            }}
            className="border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">Longer ranges unlock as this site ages.</p>

      {lockNotice && (
        <p
          role="status"
          className="mt-2 rounded-none border border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
        >
          {lockNotice}
        </p>
      )}

      {data && (
        <p className="mt-3 text-xs text-muted">
          Showing <span className="font-medium text-ink">{data.range}</span>
          {" · "}
          <span className="font-medium text-ink">{data.totals.checks}</span>{" "}
          {data.stale ? "checks in the last saved window" : "checks in this window"}
          {loading ? " · updating…" : ""}
        </p>
      )}

      <div
        key={data?.range ?? "loading"}
        className={`mt-5 transition-opacity duration-300 ${fade && !loading ? "opacity-100" : "opacity-40"}`}
      >
        {error && (
          <p className="mb-5 rounded-none border border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse border border-rule bg-accent-soft/40" />
            ))}
          </div>
        )}

        {data && data.empty && (
          <EmptyHistory data={data} busy={checking} onRecheck={recheck} error={checkError} />
        )}

        {data && !data.empty && (
          <>
            {data.stale && (
              <StaleBanner data={data} busy={checking} onRecheck={recheck} error={checkError} />
            )}
            <SiteAnalyticsBody data={data} />
          </>
        )}
      </div>
    </section>
  );
}
