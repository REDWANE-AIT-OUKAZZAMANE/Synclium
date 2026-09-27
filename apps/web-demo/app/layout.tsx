import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synclium — The Borderless Invoice",
  description:
    "Universal e-invoice interoperability engine: UBL 2.1/PEPPOL, Factur-X CII and ZATCA Phase 2 transpiled through one canonical AST. Deterministic, stateless, MIT open source.",
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
