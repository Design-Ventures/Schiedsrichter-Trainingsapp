import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "schiri.app — Werde ein besserer Schiedsrichter",
    template: "%s | schiri.app",
  },
  description:
    "Echte DFB-Prüfungsfragen aus der Schiedsrichter-Zeitung mit sofortigem Feedback nach jeder Antwort.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "schiri.app — Werde ein besserer Schiedsrichter",
    description:
      "Echte DFB-Prüfungsfragen aus der Schiedsrichter-Zeitung mit sofortigem Feedback nach jeder Antwort.",
    locale: "de_DE",
    type: "website",
    siteName: "schiri.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "schiri.app — Werde ein besserer Schiedsrichter",
    description:
      "Echte DFB-Prüfungsfragen mit sofortigem Feedback.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
