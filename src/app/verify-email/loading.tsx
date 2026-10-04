import { Sk, SkBtn, SkStatus } from "@/components/skeleton/Sk";

/** Mirrors the verify page: heading, sent-to line, six code boxes, button, resend line. */
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16" role="status" aria-busy="true">
      <SkStatus />
      <div className="w-full max-w-[400px]">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-[1.7rem]">
          <Sk>Check your email</Sk>
        </h1>
        <div className="mt-2 text-sm leading-relaxed">
          <Sk>We sent a 6-digit code to a***@example.com. Wrong email?</Sk>
        </div>
        <div className="mt-8 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">
              <Sk>Verification code</Sk>
            </p>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-12 border border-rule bg-bg sm:h-14" />
              ))}
            </div>
            <p className="mt-2 text-xs">
              <Sk>The code expires in 10 minutes. Check spam if it isn&apos;t in your inbox.</Sk>
            </p>
          </div>
          <SkBtn className="w-full py-2.5 text-center text-sm font-semibold">Verify email</SkBtn>
        </div>
        <p className="mt-6 text-sm">
          <Sk>Didn&apos;t get it? Resend code in 60s</Sk>
        </p>
      </div>
    </div>
  );
}
