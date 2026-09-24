"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  createdFormatted: string;
  description: string;
  amountFormatted: string;
  status: string | null;
  hostedInvoiceUrl: string | null;
};

export function BillingInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/invoices");
        const data = await res.json();
        if (cancelled) return;
        setConfigured(data.configured !== false);
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return <p className="mt-2 text-sm text-muted">Loading billing history…</p>;
  }
  if (!configured) {
    return (
      <p className="mt-2 text-sm text-muted">Billing history is unavailable until Stripe is configured.</p>
    );
  }
  if (!invoices.length) {
    return <p className="mt-2 text-sm text-muted">No invoices yet.</p>;
  }

  return (
    <ul className="mt-3 divide-y divide-rule border border-rule bg-surface">
      {invoices.map((inv) => (
        <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-ink">{inv.createdFormatted}</p>
            <p className="truncate text-muted">{inv.description}</p>
            <p className="text-xs text-muted capitalize">{inv.status || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-ink">{inv.amountFormatted}</span>
            {inv.hostedInvoiceUrl && (
              <a
                href={inv.hostedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                View
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
