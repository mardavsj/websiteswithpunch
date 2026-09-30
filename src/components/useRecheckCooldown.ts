"use client";

import { useCallback, useEffect, useState } from "react";
import { RECHECK_COOLDOWN_MS } from "@/lib/site-check-client";

/**
 * Seconds left before Recheck is allowed again. Based on the server's
 * lastCheckedAt (last full check), so it survives page refreshes; a 429
 * `retryAfter` or a local click can extend it via startCooldown().
 */
export function useRecheckCooldown(lastCheckedAt: string | Date | null | undefined) {
  const serverUntil = lastCheckedAt
    ? new Date(lastCheckedAt).getTime() + RECHECK_COOLDOWN_MS
    : 0;
  const [localUntil, setLocalUntil] = useState(0);
  // null until mounted: server render and first client render agree (no countdown).
  const [now, setNow] = useState<number | null>(null);
  const until = Math.max(serverUntil, localUntil);

  useEffect(() => {
    setNow(Date.now());
    if (until <= Date.now()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [until]);

  const secondsLeft =
    now == null
      ? 0
      : Math.min(RECHECK_COOLDOWN_MS / 1000, Math.max(0, Math.ceil((until - now) / 1000)));

  const startCooldown = useCallback((seconds = RECHECK_COOLDOWN_MS / 1000) => {
    setLocalUntil(Date.now() + seconds * 1000);
  }, []);

  return { secondsLeft, startCooldown };
}
