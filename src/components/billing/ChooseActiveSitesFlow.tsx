"use client";

import { KeepSitesPicker, type KeepSiteOption } from "@/components/KeepSitesPicker";
import type { SiteOption } from "./types";

type Props = {
  open: boolean;
  maxKeep: number;
  allSiteOptions: SiteOption[];
  keepOptions: KeepSiteOption[];
  loading: boolean;
  cooldownMs?: number;
  onClose: () => void;
  onConfirm: (siteIds: string[]) => void;
};

function cooldownLabel(ms: number): string {
  const until = new Date(Date.now() + ms);
  return until.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChooseActiveSitesFlow({
  open,
  maxKeep,
  allSiteOptions,
  keepOptions,
  loading,
  cooldownMs = 0,
  onClose,
  onConfirm,
}: Props) {
  const sites = allSiteOptions.map(({ id, name, url, createdAt }) => ({
    id,
    name,
    url,
    createdAt,
  }));
  const blocked = cooldownMs > 0;

  if (open && blocked) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-md rounded-none border border-rule bg-bg p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-display text-xl font-medium text-ink">Choose active sites</h2>
          <p className="mt-3 text-sm text-muted">
            You can change this again tomorrow at {cooldownLabel(cooldownMs)}.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <KeepSitesPicker
      open={open}
      title="Choose active sites"
      maxKeep={Math.max(1, Math.min(maxKeep, sites.length || 1))}
      sites={sites}
      initialSelected={keepOptions.slice(0, maxKeep).map((s) => s.id)}
      confirmLabel="Save"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
