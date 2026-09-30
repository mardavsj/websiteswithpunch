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
            <img
              src="/logo.svg"
              alt="Websites With Punch"
              className="h-28 w-28 object-contain sm:h-36 sm:w-36 lg:h-44 lg:w-44"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
