import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenInvoiceBridge — universal e-invoice interoperability",
  description:
    "Convert and validate e-invoices across UBL/PEPPOL, Factur-X/ZUGFeRD and ZATCA — right in your browser. Open source, runs locally, nothing stored.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
