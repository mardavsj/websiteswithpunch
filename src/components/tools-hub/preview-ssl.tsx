import { MiniPanel, MiniStage, okTag } from "./Stage";

const SANS = ["shop.example.com", "www.shop.example.com"];

/** SSL checker preview: certificate card with issuer, covered names and the validity window. */
export function SslPreview() {
  return (
    <MiniStage>
      <MiniPanel title="ssl · shop.example.com" tag={okTag}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-2xl font-medium tracking-tight text-emerald-700 dark:text-emerald-300">62 days left</p>
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">✓ Trusted</span>
        </div>
        <div className="mt-3 border border-dashed border-rule p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">Issued by</p>
          <p className="text-xs font-medium text-ink">Let&apos;s Encrypt · TLSv1.3</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {SANS.map((s) => (
              <span key={s} className="border border-rule bg-bg px-1.5 py-0.5 font-mono text-[10px] text-ink">{s}</span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="relative h-1.5 bg-ink/10">
            <span className="absolute inset-y-0 left-0 w-[31%] bg-accent/70" />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted">
            <span>Valid from 6 Sep</span>
            <span>Expires 5 Dec 2026</span>
          </div>
        </div>
      </MiniPanel>
    </MiniStage>
  );
}
