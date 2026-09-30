"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TechStackState } from "@/lib/tech-types";

type Status = "loading" | "ready" | "hidden";

async function call(url: string, method: "GET" | "POST") {
  const res = await fetch(url, { method, cache: "no-store", headers: { Accept: "application/json" } });
  const body = (await res.json().catch(() => null)) as (Partial<TechStackState> & { error?: string; code?: string }) | null;
  return { res, body };
}

/**
 * Tech stack state for one site, independent of uptime checks.
 * - Loads the stored result; if there is none yet, detects once automatically.
 * - recheck(): POST, allowed once per 24h (server-enforced; the countdown
 *   comes from the server's nextAllowedAt, so it survives page refreshes).
 */
export function useTechStack(siteId: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<TechStackState | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0); // server clock - client clock
  const autoRan = useRef<string | null>(null);

  const apply = useCallback((body: Partial<TechStackState> | null) => {
    if (!body || !("items" in body)) return;
    if (body.now) skew.current = new Date(body.now).getTime() - Date.now();
    setData(body as TechStackState);
  }, []);

  const recheck = useCallback(async () => {
    setDetecting(true);
    setError(null);
    try {
      const { res, body } = await call(`/api/sites/${siteId}/tech-stack`, "POST");
      if (res.status === 403) return setStatus("hidden");
      apply(body);
      // 429 = still in the 24h window: the button countdown already says so.
      if (!res.ok && res.status !== 429) setError(body?.error || `Detection failed (HTTP ${res.status})`);
    } catch {
      setError("Network error: couldn't reach the server");
    } finally {
      setDetecting(false);
      setNow(Date.now());
    }
  }, [siteId, apply]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const { res, body } = await call(`/api/sites/${siteId}/tech-stack`, "GET");
        if (cancelled) return;
        if (res.status === 403 || res.status === 404) return setStatus("hidden");
        setStatus("ready");
        if (!res.ok) return setError(body?.error || `Couldn't load (HTTP ${res.status})`);
        apply(body);
        // Nothing detected yet → run detection once, automatically.
        if (!body?.detectedAt && autoRan.current !== siteId) {
          autoRan.current = siteId;
          void recheck();
        }
      } catch {
        if (!cancelled) {
          setStatus("ready");
          setError("Network error: couldn't reach the server");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId, apply, recheck]);

  const nextAt = data?.nextAllowedAt ? new Date(data.nextAllowedAt).getTime() - skew.current : 0;
  const waitMs = Math.max(0, nextAt - now);

  // Tick the countdown: every second in the last minute, else every 30s.
  useEffect(() => {
    if (!waitMs) return;
    const t = setTimeout(() => setNow(Date.now()), waitMs < 60_000 ? 1000 : 30_000);
    return () => clearTimeout(t);
  }, [waitMs, now]);

  return { status, data, detecting, error, waitMs, recheck };
}

/** "18h 20m", "5m", "42s". */
export function formatWait(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = s < 3600 ? Math.ceil(s / 60) : Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
}
