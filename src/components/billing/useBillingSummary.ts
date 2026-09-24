"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingSummary } from "./types";

export function useBillingSummary(enabled: boolean, refreshKey?: number) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  const loadSummary = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/stripe/billing-summary");
      if (!res.ok) return;
      setSummary((await res.json()) as BillingSummary);
    } catch {
      // omit
    }
  }, [enabled]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  return { summary, loadSummary, setSummary };
}
