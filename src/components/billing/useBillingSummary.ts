"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingSummary } from "./types";

export const BILLING_CHANGED = "billing:changed";

export function useBillingSummary(enabled: boolean, refreshKey?: number) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const router = useRouter();

  const loadSummary = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/billing/summary");
      if (!res.ok) return;
      const data = (await res.json()) as BillingSummary;
      setSummary(data);
      // The server fixed a stale plan: re-render server parts (plan badge, site limit).
      if (data.healed) router.refresh();
    } catch {
      // omit
    }
  }, [enabled, router]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  // Other billing boxes on the page reload too after a change (see useBillingActions).
  useEffect(() => {
    const onChange = () => void loadSummary();
    window.addEventListener(BILLING_CHANGED, onChange);
    return () => window.removeEventListener(BILLING_CHANGED, onChange);
  }, [loadSummary]);

  return { summary, loadSummary, setSummary };
}
