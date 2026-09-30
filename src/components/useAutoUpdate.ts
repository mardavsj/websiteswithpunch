"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RecheckError } from "@/lib/site-check-client";

/** Auto update cadence (opt-in, analytics page only). */
export const AUTO_UPDATE_INTERVAL_MS = 60_000;
/** Consecutive failures before auto update switches itself off. */
const MAX_FAILURES = 3;

type Options = {
  /** False while data isn't loaded or the site is locked → forces off. */
  allowed: boolean;
  /** One update (live check + in-place refetch). Must honour the signal. */
  run: (signal: AbortSignal) => Promise<void>;
  /** ISO time of the freshest check of any kind (for the first delay). */
  lastCheckAt?: string | null;
  intervalMs?: number;
};

/**
 * Opt-in auto update. Off until start(). While on: one tick right away (or
 * once the last check is an interval old), then every interval; never
 * overlaps. It switches fully OFF (no auto-resume) on stop(), unmount /
 * navigation, tab hidden, page hide / window close, site locked, or after
 * MAX_FAILURES consecutive errors. In-flight work is aborted when it stops.
 */
export function useAutoUpdate({
  allowed,
  run,
  lastCheckAt = null,
  intervalMs = AUTO_UPDATE_INTERVAL_MS,
}: Options) {
  const [on, setOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runRef = useRef(run);
  runRef.current = run;
  const lastRef = useRef<number | null>(null);
  const known = lastCheckAt ? new Date(lastCheckAt).getTime() : 0;
  if (known > (lastRef.current ?? 0)) lastRef.current = known;
  const failures = useRef(0);
  const inFlight = useRef(false);

  const start = useCallback(() => {
    failures.current = 0;
    setError(null);
    setOn(true);
  }, []);
  const stop = useCallback(() => setOn(false), []);

  useEffect(() => {
    if (!allowed) setOn(false);
  }, [allowed]);

  // Not looking at the page any more → off.
  useEffect(() => {
    if (!on) return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") setOn(false);
    };
    const onHide = () => setOn(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [on]);

  useEffect(() => {
    if (!on) {
      setNextAt(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ctrl: AbortController | null = null;

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      const wait = Math.max(0, ms);
      timer = setTimeout(tick, wait);
      setNextAt(Date.now() + wait);
    };

    async function tick() {
      if (cancelled) return;
      if (inFlight.current) return schedule(intervalMs); // never overlap
      inFlight.current = true;
      setRunning(true);
      setNextAt(null);
      const c = new AbortController();
      ctrl = c;
      try {
        await runRef.current(c.signal);
        failures.current = 0;
        lastRef.current = Date.now();
        setError(null);
      } catch (e) {
        if (c.signal.aborted) return;
        const msg = (e instanceof Error ? e.message : "Auto update failed").replace(/\.?$/, ".");
        failures.current += 1;
        const locked = e instanceof RecheckError && e.code === "SITE_LOCKED";
        if (locked || failures.current >= MAX_FAILURES) {
          setError(`${msg} Auto update stopped.`);
          setOn(false);
          return;
        }
        setError(`${msg} Retrying…`);
      } finally {
        inFlight.current = false;
        if (ctrl === c) ctrl = null;
        if (!cancelled) setRunning(false);
      }
      if (!cancelled) schedule(intervalMs);
    }

    const since = lastRef.current ? Date.now() - lastRef.current : Infinity;
    schedule(since >= intervalMs ? 0 : intervalMs - since);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      ctrl?.abort();
      inFlight.current = false;
      setRunning(false);
    };
  }, [on, intervalMs]);

  return { on, running, nextAt, error, start, stop };
}
