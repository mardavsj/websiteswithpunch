"use client";

/**
 * Charge-now changes (upgrade, annual billing, extra site pack) are confirmed by Dodo
 * Payments off-session, usually within a couple of minutes. Poll /api/billing/sync (which
 * re-reads the subscription from Dodo) until the change shows up or we give up.
 */
export type SyncState = {
  plan: "free" | "pro" | "business";
  status: string | null;
  sitePackCount: number;
  interval: "month" | "year" | null;
};

export const PENDING_MESSAGE =
  "Payment sent. Your change applies as soon as Dodo Payments confirms it, usually within a couple of minutes.";
export const STILL_PENDING_MESSAGE =
  "Still waiting for the payment to be confirmed. Refresh in a minute; if it failed, nothing changed and nothing was charged.";

export async function syncBilling(subscriptionId?: string): Promise<SyncState | null> {
  try {
    const res = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscriptionId ? { subscriptionId } : {}),
    });
    return res.ok ? ((await res.json()) as SyncState) : null;
  } catch {
    return null;
  }
}

export async function awaitBilling(
  done: (s: SyncState) => boolean,
  opts: { subscriptionId?: string; tries?: number; everyMs?: number } = {},
): Promise<boolean> {
  const tries = opts.tries ?? 24;
  for (let i = 0; i < tries; i++) {
    const s = await syncBilling(opts.subscriptionId);
    if (s && done(s)) return true;
    await new Promise((r) => setTimeout(r, opts.everyMs ?? 4000));
  }
  return false;
}
