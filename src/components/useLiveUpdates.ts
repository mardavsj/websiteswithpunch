"use client";

import { useEffect, useRef, useState } from "react";

/** Live check cadence while the analytics page is open and visible. */
export const LIVE_INTERVAL_MS = 60_000;
/** Error backoff doubles the interval up to this cap. */
export const LIVE_MAX_BACKOFF_MS = 5 * 60_000;

type Options = {
  /** False while data isn't loaded yet or the site is locked. */
  enabled: boolean;
  /** One live update (check + refetch). Must honour the abort signal. */
  run: (signal: AbortSignal) => Promise<void>;
  /** Timestamp (ms) of the freshest known check, e.g. site.lastCheckedAt. */
  lastKnownAt?: number | null;
  intervalMs?: number;
};

/**
 * Runs `run` on an interval only while enabled, not paused by the user and the
 * tab is visible. Hidden tab → timer cleared and in-flight work aborted.
 * Unmount → everything stops. On resume it runs right away if the last update
 * is older than the current delay. Never overlaps; backs off after errors.
 */
export function useLiveUpdates({
  enabled,
  run,
  lastKnownAt = null,
  intervalMs = LIVE_INTERVAL_MS,
}: Options) {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [running, setRunning] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [delayMs, setDelayMs] = useState(intervalMs);

  const runRef = useRef(run);
  runRef.current = run;
  const knownRef = useRef<number | null>(lastKnownAt);
  knownRef.current = Math.max(knownRef.current ?? 0, lastKnownAt ?? 0) || null;
  const delayRef = useRef(intervalMs);
  const failures = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const active = enabled && !paused && visible;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ctrl: AbortController | null = null;

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, Math.max(0, ms));
    };

    async function tick() {
      if (cancelled) return;
      if (inFlight.current) return schedule(delayRef.current); // never overlap
      inFlight.current = true;
      setRunning(true);
      const c = new AbortController();
      ctrl = c;
      try {
        await runRef.current(c.signal);
        failures.current = 0;
        delayRef.current = intervalMs;
        const now = Date.now();
        knownRef.current = now;
        setUpdatedAt(now);
        setError(null);
      } catch (e) {
        if (c.signal.aborted) return;
        failures.current += 1;
        delayRef.current = Math.min(intervalMs * 2 ** failures.current, LIVE_MAX_BACKOFF_MS);
        setError(e instanceof Error ? e.message : "Live update failed");
      } finally {
        inFlight.current = false;
        if (ctrl === c) ctrl = null;
        if (!cancelled) setRunning(false);
      }
      if (cancelled) return;
      setDelayMs(delayRef.current);
      schedule(delayRef.current);
    }

    const since = knownRef.current ? Date.now() - knownRef.current : Infinity;
    schedule(since >= delayRef.current ? 0 : delayRef.current - since);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      ctrl?.abort();
      inFlight.current = false;
      setRunning(false);
    };
  }, [active, intervalMs]);

  return {
    live: active,
    paused,
    visible,
    running,
    updatedAt,
    error,
    delayMs,
    toggle: () => setPaused((p) => !p),
  };
}
