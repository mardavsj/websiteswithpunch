"use client";

import { useCallback, useState } from "react";
import { CARD_BTN, SiteCardHead, SiteCardMetrics } from "@/components/SiteCardParts";
import { SiteCardSkeleton } from "@/components/skeleton/SiteCardSkeleton";
import { useRecheckCooldown } from "@/components/useRecheckCooldown";
import { AccountPrompt, type PromptKind } from "./AccountPrompt";
import { CheckError, runCheck, type HeroCheck } from "./run-check";

const frame = "shadow-[6px_6px_0_0_hsl(var(--accent)/0.18)]";

/** Dashboard date format, in the visitor's own time zone. */
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const days = (n: number | null, what: string) => (n == null ? `${what} not available` : `${what} ${n} days left`);

/** One-line summary for the live region (the card itself isn't read out on every change). */
export function summary(r: HeroCheck) {
  const head = r.status === "up" ? "is up" : r.status === "down" ? "is down" : "couldn't be checked";
  const speed = r.latencyMs != null ? `, ${r.latencyMs} ms${r.statusCode != null ? `, HTTP ${r.statusCode}` : ""}` : "";
  return `${r.host} ${head}${speed}. ${days(r.sslDaysLeft, "SSL")}. ${days(r.domainDaysLeft, "Domain")}.${r.message ? ` ${r.message}` : ""}`;
}

/** Skeleton of the card while the first check runs (the dashboard's own SiteCardSkeleton). */
export function HeroResultSkeleton({ query }: { query: string }) {
  const host = query.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
  return (
    <div className={frame}>
      <SiteCardSkeleton nameLen={host.length} urlLen={host.length + 8} />
    </div>
  );
}

/**
 * The dashboard site card, for a one-off check: same head, four boxes and buttons. Recheck
 * re-runs the public checks (once a minute, like the dashboard; a 429 shows its wait time);
 * Analytics, Edit and Delete explain that saving the site needs a free account.
 */
export function HeroResult({ result, onResult }: { result: HeroCheck; onResult: (r: HeroCheck) => void }) {
  const cooldown = useRecheckCooldown(result.checkedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PromptKind | null>(null);
  const closePrompt = useCallback(() => setPrompt(null), []);
  const msg = error ?? result.message;
  const wait = cooldown.secondsLeft;

  async function recheck() {
    if (busy || wait > 0) return;
    setBusy(true);
    setError(null);
    try {
      onResult(await runCheck(result.host));
    } catch (e) {
      if (e instanceof CheckError && e.retryAfter) cooldown.startCooldown(e.retryAfter);
      setError(e instanceof Error ? e.message : "Recheck failed. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className={frame}>
      <article className="rounded-none border border-rule bg-surface p-5 transition hover:border-ink/20">
        <SiteCardHead name={result.host} url={result.url} status={result.status} />
        <SiteCardMetrics
          lastCheck={when(result.checkedAt)}
          latencyMs={result.latencyMs}
          statusCode={result.statusCode}
          sslDaysLeft={result.sslDaysLeft}
          domainDaysLeft={result.domainDaysLeft}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={recheck}
              disabled={busy || wait > 0}
              title={wait > 0 ? "Recheck is limited to once per minute" : undefined}
              className={CARD_BTN.recheck}
            >
              {busy ? "Checking…" : wait > 0 ? `Recheck in ${wait}s` : "Recheck"}
            </button>
            <button type="button" onClick={() => setPrompt("analytics")} className={CARD_BTN.analytics}>
              Analytics →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPrompt("edit")} className={CARD_BTN.edit}>
              Edit
            </button>
            <button type="button" onClick={() => setPrompt("delete")} className={CARD_BTN.delete}>
              Delete
            </button>
          </div>
        </div>
        {msg && <p className="mt-2 text-xs text-danger">{msg}</p>}
      </article>
      <AccountPrompt kind={prompt} site={{ name: result.domain, url: result.url }} onClose={closePrompt} />
    </div>
  );
}
