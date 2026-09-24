"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Delete",
  loading = false,
  error = null,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-lg rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="confirm-modal-title"
            className="font-display text-xl font-medium text-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            disabled={loading}
            onClick={onClose}
            className="rounded-none border border-rule px-2 py-0.5 text-sm text-muted hover:bg-accent-soft disabled:opacity-50"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-muted">{children}</div>
        {error && (
          <div className="mt-3 rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-none bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
