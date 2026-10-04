import Image from "next/image";
import { proofMetrics } from "./home-content";

export function IntroLine() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <p className="max-w-3xl font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
            A focused website health monitor. Add a URL — we check whether it’s up, SSL days left,
            and domain days left. No enterprise suite. Just the three things that quietly break live
            sites.
          </p>
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/logo.svg"
              alt="Websites With Punch logo"
              width={176}
              height={176}
              unoptimized
              className="h-28 w-28 object-contain sm:h-36 sm:w-36 lg:h-44 lg:w-44"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofStrip() {
  return (
    <section className="bg-solid text-solid-fg" aria-label="What we cover">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
        {proofMetrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-4 py-8 sm:px-6 sm:py-10 ${i > 0 ? "border-l border-solid-fg/15" : ""} ${i >= 2 ? "border-t border-solid-fg/15 sm:border-t-0" : ""}`}
          >
            <p className="font-display text-lg font-medium sm:text-xl">{m.label}</p>
            <p className="mt-1 text-sm text-solid-fg/65">{m.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
