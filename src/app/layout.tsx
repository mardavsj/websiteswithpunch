import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
  title: {
    default: "Websites With Punch — Uptime, SSL & Domain Monitoring",
    template: "%s · Websites With Punch",
  },
  description:
    "Monitor uptime, SSL certificates, and domain expiry for your websites. Free for one site. Pro for ten at $12/mo.",
  metadataBase: new URL("https://websiteswithpunch.com"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "https://www.websiteswithpunch.com/logo.png", type: "image/png" },
    ],
    apple: "https://www.websiteswithpunch.com/logo.png",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Websites With Punch",
    description: "Website health monitoring with punch — uptime, SSL, and domain expiry.",
    url: "https://websiteswithpunch.com",
    siteName: "Websites With Punch",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
