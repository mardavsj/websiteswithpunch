import Link from "next/link";
import { DomainResultView, DownResultView, SslResultView } from "./result-views";

export type ToolKind = "ssl" | "domain" | "down";
type Data = Record<string, unknown>;

/** Result card for the public checkers, with a soft "monitor it daily" link under every answer. */
export function ToolResult({ kind, data }: { kind: ToolKind; data: Data }) {
  const host = String(data.host ?? "");
  return (
    <div className="mt-6 border-t border-rule pt-6">
      {kind === "ssl" && <SslResultView d={data} />}
      {kind === "domain" && <DomainResultView d={data} />}
      {kind === "down" && <DownResultView d={data} />}
      <p className="mt-6 text-sm text-muted">
        Want this checked every day?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Monitor {host || "it"} daily for free →
        </Link>
      </p>
    </div>
  );
}

export function ToolResultSkeleton() {
  return (
    <div className="mt-6 animate-pulse border-t border-rule pt-6" aria-busy="true" aria-label="Checking">
      <div className="h-10 w-40 bg-rule/70" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-rule/50" />
        ))}
      </div>
    </div>
  );
}
