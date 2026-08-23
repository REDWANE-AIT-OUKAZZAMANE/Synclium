import type { CanonicalInvoice } from "./canonical.js";

/**
 * Shared utilities for format packages.
 */

export function amountToString(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function parseAmount(s: string): number {
  const n = parseFloat(s);
  if (Number.isNaN(n)) throw new Error(`Invalid amount string: ${s}`);
  return n;
}

export function computeTotals(inv: CanonicalInvoice) {
  const lineExtensionAmount = inv.lineItems.reduce((acc, li) => acc + parseFloat(li.lineExtensionAmount), 0);
  const taxTotal = (inv.taxBreakdowns ?? []).reduce((acc, tb) => acc + parseFloat(tb.taxAmount), 0);
  return {
    lineExtensionAmount: amountToString(lineExtensionAmount),
    taxTotal: amountToString(taxTotal),
    taxInclusive: amountToString(lineExtensionAmount + taxTotal),
  };
}

export function detectFormatFromXml(xml: string): "ubl" | "facturx" | "zatca" | "unknown" {
  if (xml.includes("CrossIndustryInvoice") || xml.includes("CrossIndustryDocument")) return "facturx";

  // ZATCA is UBL-based with KSA markers; check before generic UBL
  const zatcaMarkers = [
    /clearance:\s*1/i,
    /reporting:\s*1/i,
    /name="0[12]10000"/,
    /<cbc:ID>ICV<\/cbc:ID>/,
    /<cbc:ID>PIH<\/cbc:ID>/,
  ];
  if (
    (xml.includes("<Invoice") || xml.includes("Invoice")) &&
    (zatcaMarkers.some((r) => r.test(xml)) || xml.includes("zatca") || xml.includes("KSA"))
  ) {
    return "zatca";
  }

  if (xml.includes("<Invoice") || xml.includes("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2")) {
    return "ubl";
  }

  return "unknown";
}

/**
 * Normalize amounts for comparison in tests (round to 2 decimals, stringify).
 */
export function normalizeAmount(s: string): string {
  return parseFloat(s).toFixed(2);
}
