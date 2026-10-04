"use client";

import "./globals.css";

/** Last-resort boundary (the root layout itself failed): plain page in the site's style. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink">
        <main className="flex min-h-screen items-center justify-center px-4 py-16">
          <div className="w-full max-w-[440px]">
            <p className="label-caps">Something went wrong</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">Websites With Punch hit a snag</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Please try again in a moment.
              {error.digest ? <span className="mt-2 block text-xs">Reference: {error.digest}</span> : null}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Try again
              </button>
              {/* Plain <a>: a full load, since the app shell itself failed. */}
              <a href="/" className="border border-rule px-4 py-2.5 text-sm font-medium text-ink">
                Go to homepage
              </a>
              <a href="/dashboard" className="border border-rule px-4 py-2.5 text-sm font-medium text-ink">
                Open dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
