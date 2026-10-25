import type { Metadata } from "next";
import Link from "next/link";
import { NO_INDEX } from "@/lib/site-config";
import { readUnsubscribeToken, type AlertScope } from "@/lib/alerts/unsubscribe";
import { UnsubscribeButton } from "@/components/alerts/UnsubscribeButton";

export const metadata: Metadata = { title: "Unsubscribe", robots: NO_INDEX };
export const dynamic = "force-dynamic";

const LABEL: Record<AlertScope, string> = {
  down: "site down and recovery alerts",
  ssl: "SSL certificate alerts",
  domain: "domain expiry alerts",
  all: "all alert emails",
};

export default function UnsubscribePage({ searchParams }: { searchParams: { t?: string } }) {
  const token = typeof searchParams.t === "string" ? searchParams.t : "";
  const parsed = readUnsubscribeToken(token);
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
      <div className="w-full border border-rule bg-surface p-6 shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]">
        <p className="label-caps text-muted">Email alerts</p>
        {parsed ? (
          <>
            <h1 className="mt-2 font-display text-2xl font-medium text-ink">Unsubscribe</h1>
            <p className="mt-2 text-sm text-muted">
              Stop {LABEL[parsed.scope]} for this account? You can turn them back on any time in your profile.
            </p>
            <UnsubscribeButton token={token} label={LABEL[parsed.scope]} />
          </>
        ) : (
          <>
            <h1 className="mt-2 font-display text-2xl font-medium text-ink">Link not valid</h1>
            <p className="mt-2 text-sm text-danger">This unsubscribe link is broken or incomplete.</p>
            <p className="mt-2 text-sm text-muted">Log in and change alerts on your profile instead.</p>
          </>
        )}
        <Link href="/profile#alerts" className="mt-5 inline-block text-sm text-accent hover:underline">
          Manage alert settings
        </Link>
      </div>
    </div>
  );
}
