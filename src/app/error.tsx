"use client";

import { useEffect } from "react";
import { ErrorPanel, errorButtonClass } from "@/components/ErrorPanel";

/** Route error boundary: no internal details are shown, only a digest to quote to support. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col">
      <ErrorPanel
        label="Something went wrong"
        title="This page didn't load"
        action={
          <button type="button" onClick={reset} className={errorButtonClass}>
            Try again
          </button>
        }
      >
        It&apos;s on our side, not yours. Try again in a moment.
        {error.digest ? <span className="mt-2 block text-xs">Reference: {error.digest}</span> : null}
      </ErrorPanel>
    </div>
  );
}
