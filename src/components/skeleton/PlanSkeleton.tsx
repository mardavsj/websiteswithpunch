"use client";

import { FULL_FRAME, Sk, SkBtn, SkStatus } from "./Sk";
import { useLayoutShape } from "./shape";

const CARD = "rounded-none border border-rule bg-surface px-4 py-4";

const FREE_ROWS = [
  ["Plan price", "Free"],
  ["Site limit", "1 sites"],
  ["Usage", "1 active"],
  ["Total monthly", "$0"],
];
const PAID_ROWS = [
  ["Plan price", "$12/month"],
  ["Site limit", "10 sites"],
  ["Usage", "3 active"],
  ["Total monthly", "$12/month"],
  ["Site packs", "0 × +5 sites ($6/mo each)"],
  ["Next payment", "$12 on 4 Nov 2026"],
];

/** Mirrors the My Plan page: current plan card, upgrade / your-plan card, billing history. */
export function PlanSkeleton() {
  const { plan, active, limit, billing } = useLayoutShape();
  const paid = plan !== "free";
  const name = paid ? (plan === "pro" ? "Pro" : "Business") : "Free";

  return (
    <div className={FULL_FRAME} role="status" aria-busy="true">
      <SkStatus label="Loading plan…" />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium">
          <Sk>My Plan</Sk>
        </h1>
        <p className="mt-1 text-sm">
          <Sk>
            {name} · {active}/{limit} active
          </Sk>
        </p>
        <div className="mt-6 space-y-6">
          <div className={CARD}>
            <p className="label-caps">
              <Sk>Current plan</Sk>
            </p>
            <p className="mt-2 font-display text-xl font-medium">
              <Sk>{paid ? `${name} · Monthly` : name}</Sk>
            </p>
            <p className="mt-1 text-sm">
              <Sk>
                {paid
                  ? "Monitor up to 10 sites, with optional +5 site packs when you need more."
                  : "Monitor one site with uptime, SSL, and domain checks."}
              </Sk>
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {(paid ? PAID_ROWS : FREE_ROWS).map(([k, v]) => (
                <div key={k}>
                  <dt>
                    <Sk>{k}</Sk>
                  </dt>
                  <dd className="font-medium">
                    <Sk>{v}</Sk>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {paid ? (
            <div className="-mt-3">
              <div className={CARD}>
                <p className="label-caps">
                  <Sk>Your plan</Sk>
                </p>
                <div className="mt-2">
                  <p className="font-display text-lg font-medium">
                    <Sk>{name} · Monthly</Sk>
                  </p>
                  <p className="mt-0.5 text-sm">
                    <Sk>3/10 active sites · $12/month</Sk>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SkBtn outline className="px-3 py-1.5 text-sm font-medium">
                    Add +5 sites
                  </SkBtn>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-rule pt-3 text-xs font-medium">
                  <Sk>Switch to annual billing (2 months free)</Sk>
                  <Sk>Cancel plan</Sk>
                </div>
              </div>
            </div>
          ) : (
            <div className={CARD}>
              <p className="text-sm font-medium">
                <Sk>Upgrade</Sk>
              </p>
              <p className="mt-1 text-sm">
                <Sk>Get more site slots with Pro or Business.</Sk>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SkBtn className="px-4 py-2 text-sm font-medium">Upgrade to Pro</SkBtn>
                <SkBtn outline className="px-4 py-2 text-sm font-medium">
                  Upgrade to Business
                </SkBtn>
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-medium">
                <Sk>Billing history</Sk>
              </h2>
              {billing && (
                <SkBtn outline className="px-3 py-1.5 text-sm">
                  Manage billing
                </SkBtn>
              )}
            </div>
            <p className="mt-2 text-sm">
              <Sk>
                {billing
                  ? "Loading billing history…"
                  : "Billing history appears after you upgrade and have a Stripe customer on file."}
              </Sk>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
