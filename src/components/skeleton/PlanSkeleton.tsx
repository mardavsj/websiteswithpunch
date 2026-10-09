"use client";

import { FULL_FRAME, Sk, SkBtn, SkStatus } from "./Sk";
import { useLayoutShape } from "./shape";

const CARD = "border border-rule bg-surface";

/** Mirrors the My Plan page: hero + manage (or upgrade) card, then billing history. */
export function PlanSkeleton() {
  const { plan, active, limit, billing } = useLayoutShape();
  const paid = plan !== "free";
  const name = paid ? (plan === "pro" ? "Pro" : "Business") : "Free";

  return (
    <div className={FULL_FRAME} role="status" aria-busy="true">
      <SkStatus label="Loading plan…" />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium sm:text-3xl"><Sk>My plan</Sk></h1>
        <p className="mt-1 text-sm"><Sk>What you pay, what you get and every receipt, in one place.</Sk></p>
        <div className="mt-6 space-y-8">
          <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
            <div className={`${CARD} lg:col-span-3`}>
              <div className="h-1 bg-accent/40" />
              <div className="px-4 py-5 sm:px-6 sm:py-6">
                <p className="label-caps"><Sk>Current plan</Sk></p>
                <p className="mt-3 font-display text-4xl font-medium leading-none sm:text-5xl"><Sk>{name}</Sk></p>
                <p className="mt-3 text-sm"><Sk>Monitor up to 10 sites, with optional site packs when you need more.</Sk></p>
                <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                  {["You pay per month", "Next payment"].map((k) => (
                    <div key={k} className="bg-surface px-4 py-3">
                      <p className="label-caps"><Sk>{k}</Sk></p>
                      <p className="mt-1 font-display text-2xl font-medium"><Sk>{paid ? "$12" : "$0"}</Sk></p>
                      <p className="mt-0.5 text-xs"><Sk>plus applicable tax</Sk></p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm"><Sk>Site capacity · {active} / {limit} active</Sk></p>
                <div className="sk mt-2 h-1.5" />
              </div>
            </div>
            <div className={`${CARD} lg:col-span-2`}>
              <p className="label-caps border-b border-rule px-4 py-3"><Sk>{paid ? "Manage plan" : "Room to grow"}</Sk></p>
              <div className="px-4 py-4">
                <p className="text-sm"><Sk>{paid ? "Site packs · +5 sites each" : "One site is a great start."}</Sk></p>
                <div className="sk mt-3 h-1.5" />
                <SkBtn className="mt-3 px-3 py-1.5 text-sm font-medium">{paid ? "Add +5 sites" : "Upgrade to Pro"}</SkBtn>
              </div>
              {(paid ? ["Switch to annual billing", "Cancel plan"] : ["Pro", "Business"]).map((t) => (
                <p key={t} className="border-t border-rule px-4 py-3 text-sm"><Sk>{t}</Sk></p>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-medium"><Sk>Billing history</Sk></h2>
              {billing && <SkBtn outline className="px-3 py-1.5 text-sm">Manage billing</SkBtn>}
            </div>
            <div className={`${CARD} divide-y divide-rule`}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <span className="sk block h-4 w-24" />
                  <span className="sk ml-auto block h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
