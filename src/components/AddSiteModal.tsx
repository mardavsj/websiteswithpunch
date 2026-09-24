"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteForm } from "@/components/SiteForm";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddSiteModal({ open, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-site-title"
        className="w-full max-w-lg rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id="add-site-title" className="font-display text-xl font-medium text-ink">
            Add site
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-none border border-rule px-2 py-0.5 text-sm text-muted hover:bg-accent-soft"
          >
            ×
          </button>
        </div>
        <SiteForm
          key="add-site-form"
          mode="create"
          onCancel={onClose}
          onSuccess={() => {
            onClose();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
