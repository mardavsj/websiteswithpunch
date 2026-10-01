"use client";

import { useEffect, useState } from "react";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { SwitchMonthlyModal } from "@/components/billing/SwitchMonthlyModal";

type Props = {
  /** "annual" = monthly → annual now; "monthly" = annual → monthly at renewal. */
  flow: "annual" | "monthly" | null;
  plan: "pro" | "business";
  busy: boolean;
  onClose: () => void;
  run: (fn: () => Promise<void>) => Promise<unknown>;
  switchToAnnual: () => Promise<string | null>;
  scheduleMonthly: () => Promise<string | null>;
};

export function IntervalSwitchModals({
  flow,
  plan,
  busy,
  onClose,
  run,
  switchToAnnual,
  scheduleMonthly,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [flow]);

  const confirm = (fn: () => Promise<string | null>) => () =>
    void run(async () => {
      const err = await fn();
      setError(err);
      if (!err) onClose();
    });

  return (
    <>
      <UpgradePlanModal
        open={flow === "annual"}
        targetPlan={plan}
        loading={busy}
        message={error}
        onClose={onClose}
        onConfirm={confirm(switchToAnnual)}
      />
      <SwitchMonthlyModal
        open={flow === "monthly"}
        loading={busy}
        message={error}
        onClose={onClose}
        onConfirm={confirm(scheduleMonthly)}
      />
    </>
  );
}
