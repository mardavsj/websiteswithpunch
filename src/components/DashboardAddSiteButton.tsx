"use client";

import { useState } from "react";
import { AddSiteModal } from "@/components/AddSiteModal";

export function DashboardAddSiteButton({
  atLimit,
  label = "Add site",
  variant = "ink",
}: {
  atLimit: boolean;
  label?: string;
  variant?: "ink" | "accent";
}) {
  const [open, setOpen] = useState(false);

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
      : "rounded-none bg-ink px-4 py-2 text-sm font-medium text-bg hover:opacity-90";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        {label}
      </button>
      <AddSiteModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
