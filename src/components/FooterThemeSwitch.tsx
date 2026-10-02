"use client";

import { useTheme, type Theme } from "@/components/ThemeToggle";

const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
  {
    id: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  { id: "dark", label: "Dark", icon: <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" /> },
];

/** Light/Dark segmented switch for the footer; shares state with the navbar toggle. */
export function FooterThemeSwitch() {
  const { theme, mounted, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex self-start border border-rule p-0.5 sm:self-auto">
      {options.map((o) => {
        const on = mounted && theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(o.id)}
            className={`inline-flex h-7 items-center gap-1.5 px-2.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              on ? "bg-ink/[0.07] text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              {o.icon}
            </svg>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
