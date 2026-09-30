"use client";

import { useEffect, useState } from "react";
import type { useLiveUpdates } from "./useLiveUpdates";

type LiveState = ReturnType<typeof useLiveUpdates>;

function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function inText(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.round(s / 60)}m`;
}

/** "Live · updated Xs ago" pill with a pause/resume toggle. */
export function LiveIndicator({
  state,
  fallbackAt,
}: {
  state: LiveState;
  /** Freshest known check (site.lastCheckedAt) before the first live update. */
  fallbackAt?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  const ticking = state.visible;

  // Re-render the "Xs ago" text once a second, only while the tab is visible.
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  const at = state.updatedAt ?? (fallbackAt ? new Date(fallbackAt).getTime() : null);
  let label: string;
  if (state.paused) label = "Paused";
  else if (!state.visible) label = "Paused · tab hidden";
  else if (state.running) label = "Live · checking…";
  else label = at ? `Live · updated ${ago(now - at)}` : "Live";

  const on = state.live;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-xs text-muted"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            {on && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${on ? "bg-emerald-500" : "bg-muted"}`}
            />
          </span>
          <span className={on ? "text-ink" : ""}>{label}</span>
        </span>
        <button
          type="button"
          onClick={state.toggle}
          aria-pressed={!state.paused}
          className="border border-rule px-2 py-1 text-xs font-medium text-ink hover:bg-accent-soft"
        >
          {state.paused ? "Resume live" : "Pause live"}
        </button>
      </div>
      {state.error && !state.paused && (
        <p className="text-xs text-danger">
          Live update failed: {state.error}. Retrying in {inText(state.delayMs)}.
        </p>
      )}
    </div>
  );
}
