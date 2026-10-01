"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ModalShell,
  NoRefundNote,
  PreviewSkeleton,
  primaryBtn,
  secondaryBtn,
  useEscapeClose,
} from "@/components/billing/modal-bits";

type Preview = {
  packs: number;
  switchAtFormatted: string | null;
  newRecurringFormatted: string;
  recurringBreakdown: string;
};

type Props = {
  open: boolean;
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

/** Annual → monthly, scheduled for the renewal date. Nothing is charged, refunded or credited. */
export function SwitchMonthlyModal({ open, loading, message, onClose, onConfirm }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/stripe/switch-interval");
      const data = await res.json();
      if (!res.ok) setPreviewError(data.error || "Could not load preview.");
      else setPreview(data as Preview);
    } catch {
      setPreviewError("Could not load preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadPreview();
  }, [open, loadPreview]);

  useEscapeClose(open, onClose);
  if (!open) return null;

  const when = preview?.switchAtFormatted || "your renewal date";

  return (
    <ModalShell titleId="switch-monthly-title" onClose={onClose}>
      <h2 id="switch-monthly-title" className="font-display text-xl font-medium text-ink">
        Switch to monthly billing
      </h2>
      <div className="mt-4 space-y-3">
        {previewLoading && <PreviewSkeleton />}
        {previewError && <p className="text-sm text-danger">{previewError}</p>}
        {preview && !previewLoading && (
          <>
            <p className="font-display text-2xl font-medium text-ink">Nothing to pay today.</p>
            <p className="text-sm leading-relaxed text-muted">
              You keep annual billing until {when}, the end of the year you&apos;ve paid for. Your
              plan and sites stay the same.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              From {when} you&apos;ll pay {preview.newRecurringFormatted} (
              {preview.recurringBreakdown}), once a month on the same date.
              {preview.packs > 0 ? " Your site packs move to monthly billing too." : ""}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              You can cancel this switch anytime before {when}.
            </p>
            <NoRefundNote keep />
          </>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-danger">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || previewLoading || Boolean(previewError) || !preview}
          className={primaryBtn}
        >
          {loading ? "Working…" : `Switch to monthly on ${when}`}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn}>
          Keep annual
        </button>
      </div>
    </ModalShell>
  );
}
