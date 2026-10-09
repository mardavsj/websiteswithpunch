"use client";

import { useCallback, useEffect, useState } from "react";
import { Chip, type Tone } from "@/components/details/ui";
import { readJson } from "@/lib/read-json";
import { IconDownload, IconReceipt } from "./icons";

type Invoice = {
  id: string;
  createdFormatted: string;
  description: string;
  amountFormatted: string;
  status: string | null;
  invoiceUrl: string | null;
};

const TONE: Record<string, Tone> = { paid: "ok", failed: "bad", "action needed": "warn", processing: "accent" };
const shell = "border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]";

/** Friendly, honest empty state (icon, line, short explanation). */
export function InvoicesEmpty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center bg-accent-soft text-accent">
        <IconReceipt className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-base font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Status({ s }: { s: string | null }) {
  return s ? <Chip tone={TONE[s] ?? "neutral"}><span className="capitalize">{s}</span></Chip> : <span className="text-muted">—</span>;
}

function Receipt({ url }: { url: string | null }) {
  if (!url) return <span className="text-xs text-muted">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
      <IconDownload className="h-3.5 w-3.5" /> Invoice
    </a>
  );
}

/** Last 12 Dodo payments: a table on wide screens, stacked rows on phones. */
export function BillingInvoices() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await readJson(await fetch("/api/billing/invoices"));
      if (data.configured === false) setError("Billing history isn't available right now.");
      else if (data.error) setError(data.error);
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch {
      setError("Couldn't load billing history. Check your connection.");
      setInvoices([]);
    }
  }, []);

  useEffect(() => void load(), [load]);

  if (!invoices) {
    return (
      <div className={`${shell} divide-y divide-rule`} role="status" aria-label="Loading billing history">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <span className="sk block h-4 w-24" />
            <span className="sk hidden h-4 flex-1 sm:block" />
            <span className="sk ml-auto block h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }
  if (error && !invoices.length) {
    return (
      <div className={shell}>
        <InvoicesEmpty
          title="We couldn't fetch your invoices"
          body={error}
          action={<button type="button" onClick={() => { setInvoices(null); void load(); }} className="border border-rule px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft">Try again</button>}
        />
      </div>
    );
  }
  if (!invoices.length) {
    return (
      <div className={shell}>
        <InvoicesEmpty title="No payments yet" body="Your first receipt will land here the moment a payment goes through. Nothing to file until then." />
      </div>
    );
  }

  return (
    <div className={shell}>
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-rule text-left">
            {["Date", "Description", "Status", "Amount", ""].map((h, i) => (
              <th key={i} className={`label-caps px-4 py-2.5 font-medium ${i >= 3 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-accent-soft/40">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{inv.createdFormatted}</td>
              <td className="px-4 py-3 text-muted">{inv.description}</td>
              <td className="px-4 py-3"><Status s={inv.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-ink">{inv.amountFormatted}</td>
              <td className="px-4 py-3 text-right"><Receipt url={inv.invoiceUrl} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-rule sm:hidden">
        {invoices.map((inv) => (
          <li key={inv.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">{inv.createdFormatted}</p>
              <p className="text-sm font-medium tabular-nums text-ink">{inv.amountFormatted}</p>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <Status s={inv.status} />
              <Receipt url={inv.invoiceUrl} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
