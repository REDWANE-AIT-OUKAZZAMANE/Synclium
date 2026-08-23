import type { CanonicalInvoice, LineItem } from "@openinvoicebridge/core";
import type { ExtractionProvider } from "./types.js";
import { finalizeResult, type ExtractionInput, type ExtractionResult } from "./types.js";

/**
 * Deterministic rule-based provider used for tests, the offline demo and the
 * eval baseline. It parses a simple "OCR-like" text format — see
 * examples/eval/*.txt. It is NOT an AI model; swap in AnthropicProvider for
 * real-world extraction quality.
 *
 * Recognized shapes:
 *   INVOICE / CREDIT NOTE
 *   Invoice No|Invoice Number|Invoice #: <id>
 *   Date: YYYY-MM-DD        Due Date: YYYY-MM-DD
 *   Seller: <name>          Seller VAT: <taxId>     Seller Address: street, city, CC
 *   Buyer: ...              Buyer VAT: ...          Buyer Address: ...
 *   Currency: XXX           IBAN: <account>
 *   1. Item name | Qty: 10 | Price: 25.00 | Tax: 15% [| Cat: S]
 *   Notes: <text>
 */
export class MockProvider implements ExtractionProvider {
  readonly name = "mock";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const mime = input.mimeType || "text/plain";
    if (!mime.startsWith("text/")) {
      throw new Error(
        `MockProvider only supports text/* inputs (got ${mime}). Use AnthropicProvider for PDFs and images.`,
      );
    }
    const text = new TextDecoder().decode(input.data);

    const conf: Record<string, number> = {};
    const invoice = parseOcrText(text, conf);
    return finalizeResult(this.name, invoice, conf, 0.7);
  }
}

export function parseOcrText(text: string, conf: Record<string, number>): CanonicalInvoice {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const lower = lines.map((l) => l.toLowerCase());

  const pick = (pred: (l: string) => boolean): string | undefined => {
    const i = lower.findIndex(pred);
    return i === -1 ? undefined : valueAfter(lines[i]);
  };
  const valueAfter = (l: string) =>
    l.slice(l.indexOf(":") + 1).trim();

  const set = (path: string, present: boolean, confidence = 0.95) => {
    if (present) conf[path] = confidence;
  };

  const isCreditNote = /credit note|avoir/i.test(lines[0] ?? "") || lower.some((l) => /^credit note/.test(l));
  const id =
    pick((l) => l.startsWith("invoice no:") || l.startsWith("invoice number:") || l.startsWith("invoice #")) ?? "";
  const issueDate = pick((l) => /^date:/i.test(l)) ?? "";
  const dueDate = pick((l) => l.toLowerCase().startsWith("due date:"));
  const currency = pick((l) => l.toLowerCase().startsWith("currency:")) ?? "EUR";
  const sellerName = pick((l) => /^seller:/i.test(l)) ?? "";
  const sellerVat = pick((l) => /^seller vat:/i.test(l));
  const sellerAddr = pick((l) => /^seller address:/i.test(l)) ?? "";
  const buyerName = pick((l) => /^buyer:/i.test(l)) ?? "";
  const buyerVat = pick((l) => /^buyer vat:/i.test(l));
  const buyerAddr = pick((l) => /^buyer address:/i.test(l)) ?? "";
  const iban = pick((l) => /^iban:/i.test(l));

  const notes = lines.filter((l) => /^notes:/i.test(l)).map(valueAfter);

  const lineItems: LineItem[] = [];
  const itemRe = /^(\d+)\.\s*(.+?)\s*\|\s*Qty:\s*(-?[\d.]+)\s*\|\s*Price:\s*(-?[\d.,]+)\s*\|\s*Tax:\s*(-?[\d.]+)%(\s*\|\s*Cat:\s*(\w{1,2}))?/i;
  for (const line of lines) {
    const m = itemRe.exec(line);
    if (!m) continue;
    const [, num, name, qty, price, taxPct, , cat] = m;
    const quantity = parseFloat(qty);
    const unitPrice = parseFloat(price.replace(",", ""));
    const rate = parseFloat(taxPct);
    const categoryCode = cat?.toUpperCase() ?? (rate > 0 ? "S" : rate === 0 ? "Z" : "S");
    lineItems.push({
      id: num,
      quantity,
      unitCode: "C62",
      unitPriceAmount: fmt(unitPrice),
      lineExtensionAmount: fmt(quantity * unitPrice),
      name,
      taxes: [{ categoryCode, rate }],
    });
  }

  // Totals computed from lines (single rounding on aggregate)
  const lineSum = lineItems.reduce((a, li) => a + parseFloat(li.lineExtensionAmount), 0);
  const taxableByRate = new Map<string, number>();
  for (const li of lineItems) {
    for (const t of li.taxes) {
      const key = `${t.categoryCode}|${t.rate}`;
      taxableByRate.set(key, (taxableByRate.get(key) ?? 0) + parseFloat(li.lineExtensionAmount));
    }
  }
  let taxTotal = 0;
  const taxBreakdowns = [...taxableByRate.entries()].map(([key, taxable]) => {
    const [categoryCode, rateStr] = key.split("|");
    const rate = parseFloat(rateStr);
    const tax = round2((taxable * rate) / 100);
    taxTotal += tax;
    return {
      categoryCode,
      rate,
      taxableAmount: fmt(taxable),
      taxAmount: fmt(tax),
      ...(categoryCode !== "S" && categoryCode !== "Z"
        ? { exemptionReason: notes[0] ?? undefined }
        : {}),
    };
  });

  const totals = {
    lineExtensionAmount: fmt(round2(lineSum)),
    taxExclusiveAmount: fmt(round2(lineSum)),
    taxInclusiveAmount: fmt(round2(lineSum + taxTotal)),
    payableAmount: fmt(round2(lineSum + taxTotal)),
    taxTotalAmount: fmt(round2(taxTotal)),
  };

  const inv: any = {
    schemaVersion: "1.0",
    id,
    typeCode: isCreditNote ? "381" : "380",
    issueDate,
    ...(dueDate ? { dueDate } : {}),
    currencyCode: currency.toUpperCase(),
    seller: {
      name: sellerName,
      ...(sellerVat ? { taxId: sellerVat } : {}),
      address: parseAddress(sellerAddr),
    },
    buyer: {
      name: buyerName,
      ...(buyerVat ? { taxId: buyerVat } : {}),
      address: parseAddress(buyerAddr),
    },
    lineItems,
    taxBreakdowns,
    totals,
    ...(notes.length ? { notes } : {}),
    ...(iban ? { paymentTerms: { payeeFinancialAccount: iban } } : {}),
  };

  // Confidences for extracted fields
  set("id", !!id);
  set("issueDate", !!issueDate);
  set("dueDate", !!dueDate);
  set("currencyCode", true);
  set("seller.name", !!sellerName);
  set("seller.taxId", !!sellerVat);
  set("seller.address", !!sellerAddr, 0.85);
  set("buyer.name", !!buyerName);
  set("buyer.taxId", !!buyerVat);
  set("buyer.address", !!buyerAddr, 0.85);
  lineItems.forEach((li, i) => {
    conf[`lineItems[${i}].quantity`] = 0.9;
    conf[`lineItems[${i}].unitPriceAmount`] = 0.9;
    conf[`lineItems[${i}].lineExtensionAmount`] = 0.95;
    conf[`lineItems[${i}].name`] = 0.88;
  });
  conf["totals.payableAmount"] = 0.97;

  return inv;
}

function parseAddress(s: string): CanonicalInvoice["seller"]["address"] {
  // Expected: "street, city, CC" — tolerate missing parts.
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const ccRaw = parts.length >= 2 ? parts[parts.length - 1] : "";
  const countryCode = /^[A-Za-z]{2}$/.test(ccRaw) ? ccRaw.toUpperCase() : "XX";
  const city = parts.length >= 3 ? parts[parts.length - 2] : parts[0] ?? "";
  const street = parts.length >= 3 ? parts.slice(0, parts.length - 2).join(", ") : "";
  return {
    ...(street ? { streetName: street } : {}),
    ...(city ? { cityName: city } : {}),
    countryCode,
  };
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
