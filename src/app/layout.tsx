import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";

import { env } from "@/lib/env";

import "./globals.css";

// Self-hosted via next/font so the site's typography survives the strict CSP
// (font-src 'self') and drops the render-blocking Google Fonts @import.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

// The instrument-panel label face. Previously declared in the token stack but
// never actually loaded — every mono label fell back to the system monospace.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "C. Saint-Girons, Esq - AI Law & Legal Intelligence",
    template: "%s | C. Saint-Girons, Esq - AI Law & Legal Intelligence",
  },
  description:
    "Attorney-led AI law and legal intelligence platform focused on AI regulation monitoring, structured legal research, and source-verified regulatory analysis.",
  openGraph: {
    title: "C. Saint-Girons, Esq - AI Law & Legal Intelligence",
    description:
      "Attorney-led AI regulation monitoring and legal intelligence platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
