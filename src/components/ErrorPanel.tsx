import Link from "next/link";
import type { ReactNode } from "react";

const primary =
  "inline-flex items-center justify-center bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover";
const secondary =
  "inline-flex items-center justify-center border border-rule px-4 py-2.5 text-sm font-medium text-ink hover:bg-accent-soft";

/** Shared body for the 404 page and error boundaries: label, heading, copy and two ways out. */
export function ErrorPanel({
  label,
  title,
  children,
  action,
}: {
  label: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="w-full max-w-[440px]">
        <p className="label-caps">{label}</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
        <div className="mt-8 flex flex-wrap gap-3">
          {action}
          <Link href="/" className={action ? secondary : primary}>
            Go to homepage
          </Link>
          <Link href="/dashboard" className={secondary}>
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const errorButtonClass = primary;
