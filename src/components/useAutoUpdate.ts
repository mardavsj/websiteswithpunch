"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RECHECK_COOLDOWN_MS, RecheckError, recheckSite } from "@/lib/site-check-client";

/** Consecutive failures before auto refresh switches itself off. */
const MAX_FAILURES = 3;
const COOLDOWN_S = RECHECK_COOLDOWN_MS / 1000;

type Refresher = (signal: AbortSignal) => Promise<void> | void;
const toMs = (v: string | Date | null | undefined) => (v ? new Date(v).getTime() : 0);
const errText = (e: unknown) =>
  (e instanceof Error ? e.message : "Recheck failed").replace(/\.?$/, ".");

/**
 * One controller per site for the analytics page: manual Recheck and the
 * opt-in auto refresh/recheck share ONE cooldown timestamp and ONE 1-second
 * timer, so every countdown on the page shows the same number.
 *
 * Auto refresh: while on, a recheck runs whenever the shared cooldown ends
 * (every 60s). Tab hidden → ticks pause but the mode stays on; on return it
 * rechecks at once if the minute is up, else the countdown continues. It
 * turns off on stop(), unmount (leaving the page / sign-out), pagehide
 * (tab/window closed), SITE_LOCKED, or MAX_FAILURES consecutive errors.
 * Page state only: never persisted.
 */
export function useSiteRecheck(siteId: string, lastCheckedAt?: string | Date | null) {
  const router = useRouter();
  const [serverLast, setServerLast] = useState(() => toMs(lastCheckedAt));
  const [localUntil, setLocalUntil] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [on, setOn] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const ctrl = useRef<AbortController | null>(null);
  const failures = useRef(0);
  const refreshers = useRef(new Set<Refresher>());

  const noteServerCheck = useCallback((v: string | Date | null | undefined) => {
    const t = toMs(v);
    if (t) setServerLast((p) => Math.max(p, t));
  }, []);
  const lastMs = toMs(lastCheckedAt);
  useEffect(() => noteServerCheck(lastMs ? new Date(lastMs) : null), [lastMs, noteServerCheck]);

  const until = Math.max(serverLast ? serverLast + RECHECK_COOLDOWN_MS : 0, localUntil);
  const nextAt = on ? Math.max(until, retryAt) : until;

  // The one timer. Runs while auto refresh is on or a cooldown is counting.
  useEffect(() => {
    setNow(Date.now());
    if (!on && nextAt <= Date.now()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!on && t >= nextAt) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [on, nextAt]);

  const secondsLeft =
    now == null ? 0 : Math.min(COOLDOWN_S, Math.max(0, Math.ceil((nextAt - now) / 1000)));

  const stop = useCallback(() => {
    setOn(false);
    setRetryAt(0);
    ctrl.current?.abort();
  }, []);

  const start = useCallback(() => {
    failures.current = 0;
    setAutoError(null);
    setRetryAt(0);
    setNow(Date.now());
    setOn(true);
  }, []);

  const run = useCallback(
    async (auto: boolean) => {
      if (inFlight.current) return; // never overlap
      inFlight.current = true;
      setBusy(true);
      const c = new AbortController();
      ctrl.current = c;
      try {
        const r = await recheckSite(siteId, { auto, signal: c.signal, broadcast: false });
        setLocalUntil(Date.now() + RECHECK_COOLDOWN_MS);
        noteServerCheck(r.lastCheckedAt);
        failures.current = 0;
        setError(null);
        setAutoError(null);
        await Promise.all(Array.from(refreshers.current, (fn) => fn(c.signal)));
        router.refresh(); // soft refresh: site card updates, state + scroll kept
      } catch (e) {
        if (c.signal.aborted) return;
        const wait = e instanceof RecheckError ? e.retryAfter : undefined;
        if (wait) setLocalUntil(Date.now() + wait * 1000); // 429: follow the server
        if (!auto) {
          setError(errText(e));
        } else if (e instanceof RecheckError && e.code === "SITE_LOCKED") {
          setAutoError(`${errText(e)} Auto refresh stopped.`);
          setOn(false);
        } else if (!wait) {
          failures.current += 1;
          if (failures.current >= MAX_FAILURES) {
            setAutoError(`${errText(e)} Auto refresh stopped.`);
            setOn(false);
          } else {
            setAutoError(`${errText(e)} Retrying…`);
            setRetryAt(Date.now() + RECHECK_COOLDOWN_MS);
          }
        }
      } finally {
        inFlight.current = false;
        if (ctrl.current === c) ctrl.current = null;
        setBusy(false);
      }
    },
    [siteId, noteServerCheck, router]
  );

  const recheck = useCallback(async () => {
    if (on || secondsLeft > 0) return;
    setError(null);
    await run(false);
  }, [on, secondsLeft, run]);

  // Auto tick: driven by the shared timer; skipped while the tab is hidden.
  useEffect(() => {
    if (!on || hidden || now == null || inFlight.current || now < nextAt) return;
    void run(true);
  }, [on, hidden, now, nextAt, run]);

  // Hidden → pause (mode stays on). Page closed → off.
  useEffect(() => {
    const onVisibility = () => {
      setHidden(document.visibilityState === "hidden");
      setNow(Date.now());
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);

  // Leaving the page (unmount) aborts any request in flight.
  useEffect(() => () => ctrl.current?.abort(), []);

  const addRefresher = useCallback((fn: Refresher) => {
    refreshers.current.add(fn);
    return () => {
      refreshers.current.delete(fn);
    };
  }, []);

  return {
    siteId,
    secondsLeft,
    busy,
    error,
    recheck,
    noteServerCheck,
    addRefresher,
    auto: { on, paused: on && hidden, error: autoError, start, stop },
  };
}

export type SiteRecheck = ReturnType<typeof useSiteRecheck>;
