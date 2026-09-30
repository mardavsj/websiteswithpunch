"use client";

import type { SiteRecheck } from "./useAutoUpdate";

const STOP_LABEL = "Stop auto refresh/recheck";

/** Neutral bordered button with danger text: readable in light and dark. */
export function StopAutoButton({ onStop }: { onStop: () => void }) {
  return (
    <button
      type="button"
      onClick={onStop}
      className="rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-danger hover:bg-accent-soft"
    >
      {STOP_LABEL}
    </button>
  );
}

/** Analytics header control: start/stop + pulsing "Live" and the shared countdown. */
export function AutoUpdateControl({ rc }: { rc: SiteRecheck }) {
  const { auto } = rc;
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {auto.on && (
          <span
            role="status"
            aria-live="off"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink"
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
            <span className="tabular-nums text-muted">
              {auto.paused ? "Paused while in background" : rc.busy ? "checking…" : `${rc.secondsLeft}s`}
            </span>
          </span>
        )}
        {auto.on ? (
          <StopAutoButton onStop={auto.stop} />
        ) : (
          <button
            type="button"
            onClick={auto.start}
            aria-pressed={false}
            title="Rechecks this site every 1 minute while this page is open"
            className="rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Auto refresh/recheck
          </button>
        )}
      </div>
      {auto.error && <p className="text-xs text-danger">{auto.error}</p>}
    </div>
  );
}
