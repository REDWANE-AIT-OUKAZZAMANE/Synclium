import { describe, it, expect } from "vitest";
import {
  CanonicalInvoiceSchema,
  validateCanonicalInvoice,
  computeTotals,
  detectFormatFromXml,
} from "../src/index.js";
import type { CanonicalInvoice } from "../src/index.js";

const validInvoice: CanonicalInvoice = {
  id: "T-1",
  typeCode: "380",
  issueDate: "2024-01-01",
  currencyCode: "EUR",
  seller: { name: "Seller GmbH", address: { cityName: "Berlin", countryCode: "DE" }, taxId: "DE123" },
  buyer: { name: "Buyer BV", address: { cityName: "Amsterdam", countryCode: "NL" }, taxId: "NL001" },
  lineItems: [
    { id: "1", quantity: 2, unitCode: "C62", unitPriceAmount: "50.00", lineExtensionAmount: "100.00", taxes: [{ categoryCode: "S", rate: 21 }] },
    { id: "2", quantity: 1, unitCode: "C62", unitPriceAmount: "100.00", lineExtensionAmount: "100.00", taxes: [{ categoryCode: "S", rate: 21 }] },
  ],
  taxBreakdowns: [{ categoryCode: "S", rate: 21, taxableAmount: "200.00", taxAmount: "42.00" }],
  totals: {
    lineExtensionAmount: "200.00",
    taxExclusiveAmount: "200.00",
    taxInclusiveAmount: "242.00",
    payableAmount: "242.00",
    taxTotalAmount: "42.00",
  },
};

describe("canonical schema", () => {
  it("accepts a well-formed invoice", () => {
    const r = CanonicalInvoiceSchema.safeParse(validInvoice);
    expect(r.success).toBe(true);
  });

  it("rejects a bad country code", () => {
    const bad = structuredClone(validInvoice);
    (bad.seller.address as any).countryCode = "DEU";
    expect(CanonicalInvoiceSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a bad currency code", () => {
    const bad = structuredClone(validInvoice);
    (bad as any).currencyCode = "EURO";
    expect(CanonicalInvoiceSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects empty line items", () => {
    const bad = structuredClone(validInvoice);
    (bad as any).lineItems = [];
    expect(CanonicalInvoiceSchema.safeParse(bad).success).toBe(false);
  });

  it("defaults typeCode to 380 when omitted", () => {
    const noType: any = structuredClone(validInvoice);
    delete noType.typeCode;
    const parsed = CanonicalInvoiceSchema.parse(noType);
    expect(parsed.typeCode).toBe("380");
  });

  it("coerces numeric amounts into decimal strings", () => {
    const numAmt: any = structuredClone(validInvoice);
    numAmt.lineItems[0].unitPriceAmount = 49.5;
    const parsed = CanonicalInvoiceSchema.parse(numAmt);
    expect(parsed.lineItems[0].unitPriceAmount).toBe("49.5");
  });
});

describe("validateCanonicalInvoice", () => {
  it("passes a coherent invoice with no errors and no warnings", () => {
    const r = validateCanonicalInvoice(validInvoice);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it("warns on totals mismatch", () => {
    const bad = structuredClone(validInvoice);
    bad.totals.lineExtensionAmount = "999.00";
    const r = validateCanonicalInvoice(bad);
    expect(r.warnings.some((w) => w.code === "TOTALS_MISMATCH")).toBe(true);
  });

  it("warns on per-line qty*price mismatch", () => {
    const bad = structuredClone(validInvoice);
    bad.lineItems[0].lineExtensionAmount = "77.00";
    const r = validateCanonicalInvoice(bad);
    expect(r.warnings.some((w) => w.code === "LINE_TOTAL_MISMATCH")).toBe(true);
  });

  it("errors on structurally invalid data", () => {
    const r = validateCanonicalInvoice({ nope: true });
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("warns on tax breakdown mismatch", () => {
    const bad = structuredClone(validInvoice);
    bad.taxBreakdowns![0].taxAmount = "99.00";
    const r = validateCanonicalInvoice(bad);
    expect(r.warnings.some((w) => w.code === "TAX_MISMATCH")).toBe(true);
  });
});

describe("utils", () => {
  it("computes totals from lines + breakdowns", () => {
    const t = computeTotals(validInvoice);
    expect(t.lineExtensionAmount).toBe("200.00");
    expect(t.taxTotal).toBe("42.00");
    expect(t.taxInclusive).toBe("242.00");
  });

  it("detects UBL XML", () => {
    expect(detectFormatFromXml('<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"></Invoice>')).toBe("ubl");
  });

  it("detects Factur-X CII XML", () => {
    expect(detectFormatFromXml("<rsm:CrossIndustryInvoice></rsm:CrossIndustryInvoice>")).toBe("facturx");
  });

  it("detects ZATCA XML with KSA profile or tags", () => {
    expect(
      detectFormatFromXml(
        '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><cbc:ProfileID>reporting:1.0</cbc:ProfileID></Invoice>',
      ),
    ).toBe("zatca");
  });

  it("returns unknown for garbage", () => {
    expect(detectFormatFromXml("hello world")).toBe("unknown");
  });
});
