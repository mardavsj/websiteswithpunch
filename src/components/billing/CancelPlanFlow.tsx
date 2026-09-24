"use client";

import { PLANS, type PlanId } from "@/lib/plans";
import { KeepSitesPicker, type KeepSiteOption } from "@/components/KeepSitesPicker";

type Props = {
  open: boolean;
  plan: PlanId;
  keepOptions: KeepSiteOption[];
  endsOn: string | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (siteIds: string[]) => void;
};

export function CancelPlanFlow({
  open,
  plan,
  keepOptions,
  endsOn,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const when = endsOn || "the end of the month";
  return (
    <KeepSitesPicker
      open={open}
      title="Cancel plan"
      maxKeep={1}
      sites={keepOptions}
      confirmLabel="Cancel plan"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmDetail={(sel, locked) => (
        <>
          <p>
            You keep {PLANS[plan].name} until {when}. After that you&apos;re on Free (1 site). No
            more payments.
          </p>
          {locked.length > 0 && (
            <p className="mt-2">
              On {when}, these sites will be locked: {locked.map((s) => s.name).join(", ")}. They
              won&apos;t be checked and their details will be hidden. Nothing is deleted. Upgrade
              anytime to unlock them.
            </p>
          )}
          {sel[0] && (
            <p className="mt-2 font-medium text-ink">Staying active: {sel[0].name}</p>
          )}
        </>
      )}
    />
  );
}
