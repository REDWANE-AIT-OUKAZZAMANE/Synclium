import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CanonicalInvoiceSchema } from "@synclium/core";
import { import as importFX, export as exportFX, validate } from "../src/index.js";

const examplesDir = join(__dirname, "../../../../examples/facturx");

const validExamples = [
  "minimum-profile.xml",
  "en16931-full.xml",
  "credit-note.xml",
  "multiline-prepaid.xml",
  "reverse-charge-exempt.xml",
];

function load(name: string): string {
  return readFileSync(join(examplesDir, name), "utf-8");
}

/**
 * Fields that do not round-trip cleanly (see docs/formats/facturx.md):
 * - profileId/customizationId get defaults on export when absent
 */
function normalize(inv: any): any {
  const c = structuredClone(inv);
  delete c.extensions;
  delete c.profileId;
  delete c.customizationId;
  return c;
}

describe("Factur-X validator", () => {
  it.each(validExamples)("accepts %s", (name) => {
    const r = validate(load(name));
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("rejects an invoice without line items and totals", () => {
    const r = validate(load("invalid-missing-lines.xml"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.message.includes("SupplyChainTradeLineItem"))).toBe(true);
    expect(r.errors.some((e) => e.message.includes("MonetarySummation"))).toBe(true);
  });
});

describe("Factur-X importer", () => {
  it("converts CII date format 102 to ISO", () => {
    const inv = importFX(load("minimum-profile.xml"));
    expect(inv.issueDate).toBe("2024-05-10");
    expect(inv.id).toBe("ZG-9182-MIN");
    expect(inv.totals.payableAmount).toBe("357.00");
  });

  it("maps credit note typeCode 381", () => {
    const inv = importFX(load("credit-note.xml"));
    expect(inv.typeCode).toBe("381");
    expect(parseFloat(inv.totals.payableAmount)).toBeLessThan(0);
  });

  it("captures multi-tax breakdowns and payment data", () => {
    const inv = importFX(load("en16931-full.xml"));
    expect(inv.taxBreakdowns).toHaveLength(2);
    expect(inv.taxBreakdowns![1].categoryCode).toBe("E");
    expect(inv.paymentTerms?.payeeFinancialAccount).toBe("FR7630006000011234567890189");
    expect(inv.deliveryDate).toBe("2024-07-15");
    expect(inv.references?.orderReference).toBe("BC-2024-3391");
    expect(inv.buyerReference).toBe("SERVICE-ACHATS-77");
    expect(inv.notes![0]).toContain("Pénalités de retard");
  });

  it("captures prepaid amounts", () => {
    const inv = importFX(load("multiline-prepaid.xml"));
    expect(inv.totals.prepaidAmount).toBe("1500.00");
    expect(inv.lineItems).toHaveLength(3);
  });

  it("output always conforms to the canonical schema", () => {
    for (const name of validExamples) {
      expect(CanonicalInvoiceSchema.safeParse(importFX(load(name))).success).toBe(true);
    }
  });
});

describe("Factur-X exporter", () => {
  it("produces XML that passes our validator", () => {
    for (const name of validExamples) {
      const xml = exportFX(importFX(load(name)));
      expect(validate(xml).errors).toEqual([]);
    }
  });

  it("round-trips import→export→import stably", () => {
    for (const name of validExamples) {
      const first = importFX(load(name));
      const second = importFX(exportFX(first));
      expect(normalize(second)).toEqual(normalize(first));
    }
  });

  it("emits the Factur-X guideline in ExchangedDocumentContext", () => {
    const xml = exportFX(importFX(load("en16931-full.xml")));
    expect(xml).toContain("rsm:CrossIndustryInvoice");
    expect(xml).toContain("urn:factur-x.eu:1p0:en16931");
  });
});
