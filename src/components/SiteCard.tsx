"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { EditSiteModal } from "./EditSiteModal";
import { formatDate } from "@/lib/utils";

type Site = {
  id: string;
  name: string;
  url: string;
  status: string;
  lastCheckedAt: string | Date | null;
  lastStatusCode: number | null;
  lastLatencyMs: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
  locked?: boolean;
};

function DaysPill({ days, label, warnAt = 30 }: { days: number | null; label: string; warnAt?: number }) {
  if (days === null || days === undefined) {
    return (
      <div className="rounded-none border border-rule bg-bg px-3 py-2">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-muted">Not available</p>
        <p className="text-[10px] text-muted/80">retry recheck</p>
      </div>
    );
  }
  const warn = days <= warnAt;
  const critical = days <= 7;
  return (
    <div
      className={`rounded-none border border-rule px-3 py-2 ${
        critical ? "bg-rose-50" : warn ? "bg-amber-50" : "bg-bg"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`text-sm font-semibold ${
          critical ? "text-rose-700" : warn ? "text-amber-800" : "text-ink"
        }`}
      >
        {days} day{days === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function SiteCard({
  site,
  showAnalyticsLink = false,
  siteLimit = 1,
  canUnlock = false,
  hasLockedSites = false,
}: {
  site: Site;
  showAnalyticsLink?: boolean;
  siteLimit?: number;
  canUnlock?: boolean;
  hasLockedSites?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function remove() {
    let message: string;
    if (site.locked) {
      message = `Delete ${site.name}? This removes it and its saved history for good.`;
    } else if (hasLockedSites) {
      message = `Delete ${site.name}? This removes the site and all its history for good. You'll get 1 free slot to add a new site or unlock one of your locked sites.`;
    } else {
      message = `Delete ${site.name}? This cannot be undone.`;
    }
    if (!confirm(message)) return;
    setBusy(true);
    await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  async function recheck() {
    setBusy(true);
    await fetch(`/api/sites/${site.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check" }),
    });
    router.refresh();
    setBusy(false);
  }

  async function unlock() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/sites/${site.id}/unlock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not unlock.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (site.locked) {
    return (
      <article className="rounded-none border border-rule bg-rule/20 p-5 opacity-90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-muted">🔒</span>
              <h3 className="truncate font-display text-lg font-medium text-muted">{site.name}</h3>
            </div>
            <p className="mt-1 truncate text-sm text-muted">{site.url}</p>
            <p className="mt-2 text-sm text-muted">
              Locked. Your plan includes {siteLimit} site{siteLimit === 1 ? "" : "s"}.
            </p>
            {!canUnlock && (
              <p className="mt-1 text-xs text-muted">
                To use this site, delete an active site or upgrade.
              </p>
            )}
            {msg && <p className="mt-2 text-xs text-amber-800">{msg}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {canUnlock && (
              <button
                type="button"
                disabled={busy}
                onClick={unlock}
                className="rounded-none border border-rule bg-bg px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft disabled:opacity-50"
              >
                Unlock
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="rounded-none border border-rose-200 px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-none border border-rule bg-bg p-5 transition hover:border-ink/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-medium text-ink">{site.name}</h3>
            <StatusBadge status={site.status} />
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-accent hover:underline"
          >
            {site.url}
          </a>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-none border border-rule bg-bg px-3 py-2">
          <p className="text-xs text-muted">Last check</p>
          <p className="text-sm font-medium text-ink">{formatDate(site.lastCheckedAt)}</p>
        </div>
        <div className="rounded-none border border-rule bg-bg px-3 py-2">
          <p className="text-xs text-muted">Latency / code</p>
          <p className="text-sm font-medium text-ink">
            {site.lastLatencyMs != null ? `${site.lastLatencyMs}ms` : "—"}
            {site.lastStatusCode != null ? ` · ${site.lastStatusCode}` : ""}
          </p>
        </div>
        <DaysPill days={site.sslDaysLeft} label="SSL left" />
        <DaysPill days={site.domainDaysLeft} label="Domain left" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={recheck}
          disabled={busy}
          className="rounded-none bg-ink px-3 py-1.5 text-xs font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          Recheck
        </button>
        {showAnalyticsLink && (
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="rounded-none bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
          >
            Analytics →
          </Link>
        )}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
        >
          Edit
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="rounded-none border border-rose-200 px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <EditSiteModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        site={{ id: site.id, name: site.name, url: site.url }}
      />
    </article>
  );
}
