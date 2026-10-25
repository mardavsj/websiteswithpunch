import type { ReactNode } from "react";

/** Two columns on lg+ (summary ~40% left, sticky; explanation ~60% right); one column below. */
export function Cols({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
      <div className="lg:sticky lg:top-0">{left}</div>
      <div className="mt-3 lg:mt-0">{right}</div>
    </div>
  );
}

type Frame = {
  label: string;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  chip?: ReactNode;
  /** Close control for the header (button or link) and for the footer. */
  close: ReactNode;
  closeFooter: ReactNode;
  backdrop: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Shell shared by the analytics and admin dialogs: page-width, below the navbar, ~88vh. */
export function ModalFrame({ label, icon, eyebrow, title, subtitle, chip, close, closeFooter, backdrop, footer, children }: Frame) {
  return (
    <div className="modal-fade fixed inset-0 z-[60]">
      {backdrop}
      <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl sm:px-6 sm:pb-6 sm:pt-[76px]">
        <div
          id="app-modal"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className="modal-pop pointer-events-auto flex h-[100dvh] w-full flex-col bg-bg !outline-none sm:h-[min(88vh,100%)] sm:border sm:border-rule sm:shadow-[0_24px_60px_-16px_rgb(0_0_0/0.28)]"
        >
          <header className="flex flex-none items-start gap-3 border-b border-rule bg-surface px-4 py-3.5 sm:px-6">
            {icon && <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-accent-soft text-accent ring-1 ring-inset ring-accent/15">{icon}</span>}
            <div className="min-w-0 flex-1">
              {eyebrow && <p className="label-caps text-muted">{eyebrow}</p>}
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2 className="min-w-0 break-words font-display text-lg font-medium leading-6 text-ink">{title}</h2>
                {chip}
              </div>
              {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
            </div>
            <span className="hidden shrink-0 self-center border border-rule px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline" aria-hidden>Esc</span>
            {close}
          </header>
          <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
          <footer className="flex flex-none flex-wrap items-center justify-end gap-2 border-t border-rule bg-surface px-4 py-3 sm:px-6">
            {closeFooter}
            {footer}
          </footer>
        </div>
      </div>
    </div>
  );
}

export const X_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const CLOSE_X =
  "-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center self-center text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
export const BTN_2 =
  "border border-rule bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
export const BTN_1 =
  "bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
