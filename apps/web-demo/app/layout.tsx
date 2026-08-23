import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synclium — Universal E-Invoice Bridge & AI Extraction",
  description:
    "Convert, validate, and extract e-invoices across UBL/PEPPOL, Factur-X/ZUGFeRD, and ZATCA. Zero-knowledge in-memory processing with Google Gemini Flash AI extraction.",
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/favicon/site.webmanifest",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
