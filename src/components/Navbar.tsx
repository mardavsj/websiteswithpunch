"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { GuestMenu } from "@/components/GuestMenu";
import { NavUpgradeButtons } from "@/components/NavUpgradeButtons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex min-w-0 items-center gap-2 font-display text-sm font-medium text-ink sm:gap-2.5 sm:text-base"
        >
          <img
            src="https://websiteswithpunch.com/logo.png"
            alt="Websites With Punch"
            className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8"
          />
          <span className="truncate">Websites With Punch</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
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
              <Link
                href="/login"
                className="hidden rounded-none px-3 py-1.5 text-ink hover:bg-accent-soft md:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-none bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover md:inline-flex"
              >
                Start free
              </Link>
              <ThemeToggle />
              <div className="md:hidden">
                <GuestMenu />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
