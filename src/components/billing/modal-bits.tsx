"use client";

import { useEffect, type ReactNode } from "react";
import { ModalPortal, DIALOG_SCROLL } from "@/components/ModalPortal";

/** Shared pieces of the plain-language billing confirm windows. */
export function PreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="h-8 w-40 bg-rule/60" />
      <div className="h-4 w-full bg-rule/40" />
      <div className="h-4 w-5/6 bg-rule/40" />
      <div className="h-4 w-4/6 bg-rule/40" />
    </div>
  );
}

export function useEscapeClose(open: boolean, onClose: () => void) {
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
}

/** Backdrop + dialog box used by every billing window. */
export function ModalShell({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-solid/40 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`${DIALOG_SCROLL} w-full max-w-lg rounded-none border border-rule bg-surface p-6 shadow-lg`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

export const primaryBtn =
  "rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60";
export const secondaryBtn =
  "rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft";

/** No-refunds line for billing windows. keep = also say the paid-for time isn't credited. */
export function NoRefundNote({ keep = false, className = "" }: { keep?: boolean; className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Payments are non-refundable
      {keep ? ", so there's no refund or credit for time you've already paid for" : ""}.
    </p>
  );
}
