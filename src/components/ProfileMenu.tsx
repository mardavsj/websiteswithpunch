"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { usePlanUpgrade } from "@/components/usePlanUpgrade";

const itemClass =
  "flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-accent-soft focus:bg-accent-soft md:min-h-0 md:py-2";
const accentItemClass =
  "flex min-h-11 w-full items-center px-3 text-left text-sm font-medium text-accent hover:bg-accent-soft focus:bg-accent-soft md:min-h-0 md:py-2";

export function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [hasBilling, setHasBilling] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    plan,
    loading,
    message,
    upgradeOpen,
    setUpgradeOpen,
    checkout,
    showUpgrades,
  } = usePlanUpgrade();

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setHasBilling(Boolean(data.hasBilling));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session?.user) return null;
  const initial = (session.user.name || session.user.email || "?").charAt(0).toUpperCase();

  async function openPortal() {
    setOpen(false);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  function startBusinessUpgrade() {
    setOpen(false);
    setUpgradeOpen(true);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule bg-accent-soft text-sm font-medium text-ink hover:bg-bg"
        title="Account"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 max-w-[calc(100vw-2rem)] border border-rule bg-surface py-1 shadow-lg"
        >
          {showUpgrades && (
            <div className="md:hidden">
              {plan === "free" && (
                <>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={loading !== null}
                    onClick={() => {
                      setOpen(false);
                      void checkout("pro");
                    }}
                    className={`${accentItemClass} disabled:opacity-60`}
                  >
                    {loading === "pro" ? "…" : "Upgrade to Pro"}
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={loading !== null}
                    onClick={() => {
                      setOpen(false);
                      void checkout("business");
                    }}
                    className={`${accentItemClass} disabled:opacity-60`}
                  >
                    {loading === "business" ? "…" : "Upgrade to Business"}
                  </button>
                </>
              )}
              {plan === "pro" && (
                <button
                  role="menuitem"
                  type="button"
                  disabled={loading !== null}
                  onClick={startBusinessUpgrade}
                  className={`${accentItemClass} disabled:opacity-60`}
                >
                  Upgrade to Business
                </button>
              )}
              <div className="my-1 border-t border-rule" role="separator" />
            </div>
          )}
          <Link
            role="menuitem"
            href="/profile"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            Profile
          </Link>
          {hasBilling && (
            <button
              role="menuitem"
              type="button"
              onClick={openPortal}
              className={itemClass}
            >
              Manage billing
            </button>
          )}
          <Link
            role="menuitem"
            href="/plan"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            My Plan
          </Link>
          <div className="my-1 border-t border-rule" role="separator" />
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex min-h-11 w-full items-center px-3 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-50 md:min-h-0 md:py-2 dark:text-red-400 dark:hover:bg-red-500/15 dark:focus:bg-red-500/15 dark:active:bg-red-500/15"
          >
            Sign out
          </button>
        </div>
      )}
      {plan === "pro" && (
        <UpgradePlanModal
          open={upgradeOpen}
          loading={loading === "business"}
          message={message}
          onClose={() => setUpgradeOpen(false)}
          onConfirm={() => checkout("business")}
        />
      )}
    </div>
  );
}
