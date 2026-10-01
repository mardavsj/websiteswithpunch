import type { ReactNode } from "react";

/** Full-height auth layout below the navbar: one centered form column, same on every screen size. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.7rem]">
        {title}
      </h1>
      {children ? <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div> : null}
    </div>
  );
}

const tones = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
};

export function AuthNotice({
  tone,
  children,
  className = "mt-4",
}: {
  tone: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`${className} rounded-none border px-3 py-2.5 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
