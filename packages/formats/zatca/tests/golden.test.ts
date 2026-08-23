import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CanonicalInvoiceSchema } from "@synclium/core";
import { import as importZATCA, export as exportZATCA, validate } from "../src/index.js";

const examplesDir = join(__dirname, "../../../../examples/zatca");

const validExamples = [
  "standard-invoice.xml",
  "simplified-b2c.xml",
  "credit-note.xml",
  "export-zero-rated.xml",
  "multiline-prepaid.xml",
  "simplified-multiline.xml",
];

function load(name: string): string {
  return readFileSync(join(examplesDir, name), "utf-8");
}

/**
 * Fields that do not round-trip cleanly (see docs/formats/zatca.md):
 * - extensions (zatca:uuid/ICV/PIH) — export injects defaults when absent
 */
function normalize(inv: any): any {
  const c = structuredClone(inv);
  delete c.extensions;
  return c;
}

describe("ZATCA validator", () => {
  it.each(validExamples)("accepts %s", (name) => {
    const r = validate(load(name));
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("rejects an invoice missing ProfileID and TaxTotal", () => {
    const r = validate(load("invalid-missing-profile-tax.xml"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.message.includes("ProfileID"))).toBe(true);
    expect(r.errors.some((e) => e.message.includes("TaxTotal"))).toBe(true);
  });
});

describe("ZATCA importer", () => {
  it("captures ZATCA-specific extensions", () => {
    const inv = importZATCA(load("standard-invoice.xml"));
    expect(inv.extensions?.["zatca:uuid"]).toBe("7d6f4a3b-2c1e-4f5a-9b8d-3e2f1a0b9c8d");
    expect(inv.extensions?.["zatca:ICV"]).toBe("42");
    expect(inv.profileId).toBe("clearance:1.0");
    // Base UBL fields still mapped
    expect(inv.seller.taxId).toBe("300051234500003");
    expect(inv.currencyCode).toBe("SAR");
  });

  it("maps simplified B2C profile", () => {
    const inv = importZATCA(load("simplified-b2c.xml"));
    expect(inv.profileId).toBe("reporting:1.0");
    expect(inv.lineItems).toHaveLength(2);
  });

  it("maps credit notes with billing reference", () => {
    const inv = importZATCA(load("credit-note.xml"));
    expect(inv.typeCode).toBe("381");
    expect(inv.references?.billingReference).toBe("STD-TINV-2024-00917");
  });

  it("output always conforms to the canonical schema", () => {
    for (const name of validExamples) {
      expect(CanonicalInvoiceSchema.safeParse(importZATCA(load(name))).success).toBe(true);
    }
  });
});

describe("ZATCA exporter", () => {
  it("produces XML that passes our validator", () => {
    for (const name of validExamples) {
      const xml = exportZATCA(importZATCA(load(name)));
      expect(validate(xml).errors).toEqual([]);
    }
  });

  it("round-trips import→export→import stably", () => {
    for (const name of validExamples) {
      const first = importZATCA(load(name));
      const second = importZATCA(exportZATCA(first));
      expect(normalize(second)).toEqual(normalize(first));
    }
  });

  it("injects ZATCA UUID / ProfileID / ICV / PIH on export", () => {
    const inv = importZATCA(load("standard-invoice.xml"));
    const xml = exportZATCA(inv);
    expect(xml).toContain("<cbc:UUID>7d6f4a3b-2c1e-4f5a-9b8d-3e2f1a0b9c8d</cbc:UUID>");
    expect(xml).toContain("<cbc:ProfileID>clearance:1.0</cbc:ProfileID>");
    expect(xml).toContain("<cbc:ID>ICV</cbc:ID>");
    expect(xml).toContain("<cbc:ID>PIH</cbc:ID>");
    expect(xml).toContain('name="0100000"');
  });

  it("defaults to reporting:1.0 profile for canonical invoices with no hint", () => {
    const xml = exportZATCA({
      id: "X-1",
      typeCode: "380",
      issueDate: "2025-01-01",
      currencyCode: "SAR",
      seller: { name: "S", address: { countryCode: "SA", cityName: "Riyadh" }, taxId: "300000000000003" },
      buyer: { name: "B", address: { countryCode: "SA", cityName: "Jeddah" }, taxId: "310000000000003" },
      lineItems: [{ id: "1", quantity: 1, unitPriceAmount: "100.00", lineExtensionAmount: "100.00", taxes: [{ categoryCode: "S", rate: 15 }] }],
      totals: { lineExtensionAmount: "100.00", taxExclusiveAmount: "100.00", taxInclusiveAmount: "115.00", payableAmount: "115.00", taxTotalAmount: "15.00" },
      taxBreakdowns: [{ categoryCode: "S", rate: 15, taxableAmount: "100.00", taxAmount: "15.00" }],
    });
    expect(xml).toContain("<cbc:ProfileID>reporting:1.0</cbc:ProfileID>");
    expect(validate(xml).valid).toBe(true);
  });
});
