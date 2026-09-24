"use client";

import { KeepSitesPicker, type KeepSiteOption } from "@/components/KeepSitesPicker";

type Props = {
  open: boolean;
  keepOptions: KeepSiteOption[];
  renewsOn: string | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (siteIds: string[]) => void;
};

export function DowngradeFlow({
  open,
  keepOptions,
  renewsOn,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const when = renewsOn || "your next billing date";
  return (
    <KeepSitesPicker
      open={open}
      title="Switch to Pro"
      maxKeep={10}
      sites={keepOptions}
      confirmLabel="Switch to Pro"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmDetail={(_sel, locked) => (
        <>
          <p>Nothing is charged or refunded today.</p>
          <p className="mt-2">
            You keep Business until {when}. From {when} you&apos;ll pay $12/month.
          </p>
          {locked.length > 0 && (
            <p className="mt-2">
              On {when}, these {locked.length} sites will be locked:{" "}
              {locked.map((s) => s.name).join(", ")}. They won&apos;t be checked and their details
              will be hidden. Nothing is deleted. Upgrade anytime to unlock them.
            </p>
          )}
        </>
      )}
    />
  );
}
