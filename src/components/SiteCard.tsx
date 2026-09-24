"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { EditSiteModal } from "./EditSiteModal";
import { DeleteSiteButton } from "./DeleteSiteButton";
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
      <div className="rounded-none border border-rule bg-surface px-3 py-2">
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
        critical ? "bg-rose-50 dark:bg-rose-400/10" : warn ? "bg-amber-50 dark:bg-amber-400/10" : "bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`text-sm font-semibold ${
          critical ? "text-rose-700 dark:text-rose-300" : warn ? "text-amber-800 dark:text-amber-200" : "text-ink"
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
      <article className="rounded-none border border-rule bg-surface p-5 opacity-90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="text-muted">
                  🔒
                </span>
                <h3 className="truncate font-display text-lg font-medium text-muted">{site.name}</h3>
              </div>
              <p
                title={site.url}
                className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-muted"
              >
                {site.url}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">
              Locked. Your plan includes {siteLimit} site{siteLimit === 1 ? "" : "s"}.
            </p>
            {!canUnlock && (
              <p className="mt-1 text-xs text-muted">
                To use this site, delete an active site or upgrade.
              </p>
            )}
            {msg && <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{msg}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {canUnlock && (
              <button
                type="button"
                disabled={busy}
                onClick={unlock}
                className="rounded-none border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft disabled:opacity-50"
              >
                Unlock
              </button>
            )}
            <DeleteSiteButton
              siteId={site.id}
              siteName={site.name}
              locked
              hasLockedSites={hasLockedSites}
              disabled={busy}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-none border border-rule bg-surface p-5 transition hover:border-ink/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-lg font-medium text-ink">{site.name}</h3>
          <StatusBadge status={site.status} />
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noreferrer"
          title={site.url}
          className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-accent hover:underline"
        >
          {site.url}
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-none border border-rule bg-surface px-3 py-2">
          <p className="text-xs text-muted">Last check</p>
          <p className="text-sm font-medium text-ink">{formatDate(site.lastCheckedAt)}</p>
        </div>
        <div className="rounded-none border border-rule bg-surface px-3 py-2">
          <p className="text-xs text-muted">Latency / code</p>
          <p className="text-sm font-medium text-ink">
            {site.lastLatencyMs != null ? `${site.lastLatencyMs}ms` : "—"}
            {site.lastStatusCode != null ? ` · ${site.lastStatusCode}` : ""}
          </p>
        </div>
        <DaysPill days={site.sslDaysLeft} label="SSL left" />
        <DaysPill days={site.domainDaysLeft} label="Domain left" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={recheck}
            disabled={busy}
            className="rounded-none bg-solid px-3 py-1.5 text-xs font-medium text-solid-fg hover:opacity-90 disabled:opacity-50"
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
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Edit
          </button>
          <DeleteSiteButton
            siteId={site.id}
            siteName={site.name}
            hasLockedSites={hasLockedSites}
            disabled={busy}
          />
        </div>
      </div>

      <EditSiteModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        site={{ id: site.id, name: site.name, url: site.url }}
      />
    </article>
  );
}
