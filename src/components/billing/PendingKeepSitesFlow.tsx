"use client";

import { KeepSitesPicker, type KeepSiteOption } from "@/components/KeepSitesPicker";

type Props = {
  open: boolean;
  maxKeep: number;
  keepOptions: KeepSiteOption[];
  loading: boolean;
  onClose: () => void;
  onConfirm: (siteIds: string[]) => void;
};

/** Change keep-selection while a cancel/downgrade/pack removal is still pending. */
export function PendingKeepSitesFlow({
  open,
  maxKeep,
  keepOptions,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <KeepSitesPicker
      open={open}
      title="Change which sites stay active"
      maxKeep={Math.max(1, Math.min(maxKeep, keepOptions.length || 1))}
      sites={keepOptions}
      initialSelected={keepOptions.slice(0, maxKeep).map((s) => s.id)}
      confirmLabel="Save"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
