const isDev = process.env.NODE_ENV === "development";
const onVercel = Boolean(process.env.VERCEL);

/**
 * Content-Security-Policy. Pages are static/ISR, so per-request nonces aren't possible:
 * scripts allow 'self' + 'unsafe-inline' (Next's inline bootstrap and the theme script) and
 * nothing else from third parties except Vercel Analytics. 'unsafe-eval' is dev only.
 * Dodo Payments checkout and the customer portal open as full-page redirects, so they need
 * no CSP entries (no Dodo script, frame or form runs on our pages).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://vitals.vercel-insights.com${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(onVercel ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, subdomains included: meets the hstspreload.org requirements.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Signed-in pages and API replies never belong in a shared cache.
      // (/api/tools/* sets its own short public cache for the free checkers.)
      // The tour video, captions and poster: a week in the browser cache, so replays don't re-download.
      { source: "/video/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/api/((?!tools/).*)", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
