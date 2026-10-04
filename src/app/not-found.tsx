import type { Metadata } from "next";
import { ErrorPanel } from "@/components/ErrorPanel";
import { NO_INDEX } from "@/lib/site-config";

export const metadata: Metadata = { title: "Page not found", robots: NO_INDEX };

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <ErrorPanel label="404" title="We couldn't find that page">
        The link may be old or mistyped. If you were looking for one of your sites, it may have been
        removed from your dashboard.
      </ErrorPanel>
    </div>
  );
}
