"use client";

import { useEffect, useState } from "react";
import { AddSiteModal } from "@/components/AddSiteModal";
import { takePendingSite, type PendingSite } from "@/lib/pending-site";

export function DashboardAddSiteButton({
  atLimit,
  label = "Add site",
  variant = "ink",
  pickUpPending = false,
}: {
  atLimit: boolean;
  label?: string;
  variant?: "ink" | "accent";
  /** Open prefilled with a site checked on the homepage before signup (one button per page). */
  pickUpPending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<PendingSite | null>(null);

  useEffect(() => {
    if (!pickUpPending) return;
    const site = takePendingSite();
    if (site && !atLimit) {
      setPrefill(site);
      setOpen(true);
    }
  }, [pickUpPending, atLimit]);

  if (atLimit) {
    return (
      <span className="rounded-none border border-rule bg-accent-soft px-4 py-2 text-sm text-muted">
        Site limit reached
      </span>
    );
  }

  const btnClass =
    variant === "accent"
      ? "inline-flex rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      : "rounded-none bg-solid px-4 py-2 text-sm font-medium text-solid-fg hover:opacity-90";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        {label}
      </button>
      <AddSiteModal
        key={prefill?.url ?? "add"}
        open={open}
        onClose={() => {
          setOpen(false);
          setPrefill(null);
        }}
        initialName={prefill?.name}
        initialUrl={prefill?.url}
      />
    </>
  );
}
