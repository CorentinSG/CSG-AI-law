import type { Metadata } from "next";

import { env } from "@/lib/env";

import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
