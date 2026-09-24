"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { NavUpgradeButtons } from "@/components/NavUpgradeButtons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 font-display text-base font-medium text-ink"
        >
          <img
            src="https://websiteswithpunch.com/logo.png"
            alt="Websites With Punch"
            className="logo-mark h-8 w-8 object-contain"
          />
          <span>Websites With Punch</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {status === "loading" ? (
            <ThemeToggle />
          ) : session ? (
            <>
              <NavUpgradeButtons />
              <ThemeToggle />
              <ProfileMenu />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-none px-3 py-1.5 text-ink hover:bg-accent-soft">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-none bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
              >
                Start free
              </Link>
              <ThemeToggle />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
