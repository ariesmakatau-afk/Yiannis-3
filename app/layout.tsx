import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import StructuredData from "@/components/StructuredData";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import EmberField from "@/components/theme/EmberField";
import RevealOnScroll from "@/components/theme/RevealOnScroll";
import { siteMeta } from "@/lib/content";

// Cormorant Garamond — a refined, high-contrast serif for headings and the wordmark.
const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

// Cormorant Garamond italic for taglines, keeping the type system to two families.
const scriptFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-script",
});

// Inter — clean sans for body copy, nav and UI.
const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e6ded4",
};

export const metadata: Metadata = {
  title: {
    default: siteMeta.titleDefault,
    template: "%s | Yianni's on Hindley Street",
  },
  description: siteMeta.description,
  openGraph: {
    title: siteMeta.titleDefault,
    description: siteMeta.description,
    siteName: "Yianni's on Hindley Street",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${displayFont.variable} ${scriptFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <StructuredData />
        <GoogleAnalytics />
        {/* Live sparks off the coals (sending an order sets off a fountain) */}
        <EmberField />
        <RevealOnScroll />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-chalk focus:px-4 focus:py-2 focus:text-cobalt"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1 pb-4 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
