"use client";

import { useEffect, useState } from "react";
import type { useAutoUpdate } from "./useAutoUpdate";

type AutoState = ReturnType<typeof useAutoUpdate>;

/** "Auto update" button; while on: pulsing "Live" + seconds to next update. */
export function AutoUpdateControl({ state }: { state: AutoState }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!state.on) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.on]);

  const secs =
    state.nextAt != null && now ? Math.max(0, Math.ceil((state.nextAt - now) / 1000)) : null;

  return (
    <div className="flex min-w-0 flex-col gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {state.on && (
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
              {state.running ? "checking…" : secs != null ? `${secs}s` : ""}
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={state.on ? state.stop : state.start}
          aria-pressed={state.on}
          title="Runs a live check every 1 minute while you stay on this page"
          className="border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
        >
          {state.on ? (
            "Stop auto update"
          ) : (
            <>
              Auto update <span className="font-normal text-muted">· every 1 min</span>
            </>
          )}
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}
