"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { lockedRangeNotice, type RangeKey } from "@/lib/analytics";
import { SiteAnalyticsBody, type AnalyticsPayload } from "./SiteAnalyticsBody";
import { EmptyHistory, StaleBanner } from "./AnalyticsNotices";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { LiveIndicator } from "./LiveIndicator";
import { useLiveUpdates } from "./useLiveUpdates";
import { onSiteChecked, recheckSite } from "@/lib/site-check-client";

type LoadOpts = { quiet?: boolean; signal?: AbortSignal };

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
  const [siteLocked, setSiteLocked] = useState(false);
  const [fade, setFade] = useState(true);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const router = useRouter();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rangeRef = useRef<RangeKey>(range);
  rangeRef.current = range;
  const seq = useRef(0);

  const unlockedRanges: RangeKey[] = data?.unlockedRanges?.length ? data.unlockedRanges : ["24h"];
  const ageDays = data?.ageDays ?? 0;

  const clearNotice = useCallback(() => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = null;
    setLockNotice(null);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  /** quiet = background refresh: no fade/spinner, errors go to the caller. */
  const load = useCallback(
    async (r: RangeKey, opts: LoadOpts = {}) => {
      // Manual loads bump the sequence; quiet ones only apply if none started since.
      const id = opts.quiet ? seq.current : ++seq.current;
      if (!opts.quiet) {
        setLoading(true);
        setError(null);
        setFade(false);
      }
      try {
        const res = await fetch(
          `/api/sites/${siteId}/analytics?range=${encodeURIComponent(r)}&_=${Date.now()}`,
          { cache: "no-store", headers: { Accept: "application/json" }, signal: opts.signal }
        );
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          if (res.status === 403 && j?.code === "SITE_LOCKED") setSiteLocked(true);
          throw new Error(j?.error || "Could not load analytics");
        }
        const json = (await res.json()) as AnalyticsPayload;
        if (id !== seq.current) return; // a newer request (e.g. range change) won
        setData(json);
        setRange(json.range);
        if (opts.quiet) setError(null);
      } catch (e) {
        if (opts.quiet || opts.signal?.aborted) throw e;
        if (id === seq.current) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!opts.quiet && id === seq.current) {
          setLoading(false);
          requestAnimationFrame(() => setFade(true));
        }
      }
    },
    [siteId]
  );

  useEffect(() => {
    void load("24h");
  }, [siteId, load]);

  function selectRange(next: RangeKey) {
    if (!unlockedRanges.includes(next)) {
      setLockNotice(lockedRangeNotice(ageDays, next));
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setLockNotice(null), 6000);
      return;
    }
    clearNotice();
    setRange(next);
    void load(next);
  }

  // Any successful manual Recheck (site card or banner) → refetch in place.
  useEffect(() => onSiteChecked(siteId, () => void load(rangeRef.current)), [siteId, load]);

  // Live mode: cheap server-throttled uptime check + quiet refetch.
  const live = useLiveUpdates({
    enabled: Boolean(data) && !siteLocked,
    lastKnownAt: data?.site?.lastCheckedAt ? new Date(data.site.lastCheckedAt).getTime() : null,
    run: async (signal) => {
      await recheckSite(siteId, { live: true, signal, broadcast: false });
      await load(rangeRef.current, { quiet: true, signal });
      router.refresh(); // soft refresh: updates the site card, keeps state + scroll
    },
  });

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
      <AnalyticsHeader
        range={range}
        unlockedRanges={unlockedRanges}
        ageDays={ageDays}
        loading={loading}
        onSelect={selectRange}
        onRefresh={() => {
          clearNotice();
          void load(range);
        }}
        live={
          data && !siteLocked ? (
            <LiveIndicator state={live} fallbackAt={data.site?.lastCheckedAt} />
          ) : null
        }
      />

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

        {data && !siteLocked && data.empty && (
          <EmptyHistory data={data} busy={checking} onRecheck={recheck} error={checkError} />
        )}

        {data && !siteLocked && !data.empty && (
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
