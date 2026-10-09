import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AppFooter } from "@/components/AppFooter";
import { SiteChrome } from "@/components/SiteChrome";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TAGLINE,
  THEME_DARK,
  THEME_LIGHT,
} from "@/lib/site-config";

/** Default share card (X, LinkedIn, Slack…). Absolute URL so every crawler resolves it. */
const OG_IMAGE = {
  url: `${SITE_URL}/og-default.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${SITE_NAME}: uptime, SSL and domain expiry monitoring`,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Uptime, SSL & Domain Expiry Monitoring`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME}: ${TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: ${TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_DARK },
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

// No session read here: it would make every page dynamic. The client SessionProvider resolves it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <SiteChrome footer={<Footer />} appFooter={<AppFooter />}>
              {children}
            </SiteChrome>
          </div>
        </Providers>
        {/* Cookie-free Vercel Web Analytics + Speed Insights (only on Vercel deployments). */}
        {process.env.VERCEL ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
