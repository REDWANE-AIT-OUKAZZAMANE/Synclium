import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synclium — Universal E-Invoice Bridge & AI Extraction",
  description:
    "Convert, validate, and extract e-invoices across UBL/PEPPOL, Factur-X/ZUGFeRD, and ZATCA. Zero-knowledge in-memory processing with Google Gemini Flash AI extraction.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
