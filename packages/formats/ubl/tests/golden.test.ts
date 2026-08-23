import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CanonicalInvoiceSchema } from "@openinvoicebridge/core";
import { import as importUBL, export as exportUBL, validate } from "../src/index.js";

const examplesDir = join(__dirname, "../../../../examples/ubl");

const validExamples = [
  "invoice-basic.xml",
  "credit-note.xml",
  "multiline-multitax.xml",
  "reverse-charge.xml",
  "edge-minimal.xml",
];

function load(name: string): string {
  return readFileSync(join(examplesDir, name), "utf-8");
}

/** Strip fields that legitimately do not round-trip (see docs/formats/ubl.md). */
function normalize(inv: any): any {
  const c = structuredClone(inv);
  delete c.extensions;
  delete c.profileId;
  delete c.customizationId;
  return c;
}

describe("UBL validator", () => {
  it.each(validExamples)("accepts %s", (name) => {
    const r = validate(load(name));
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("rejects a broken invoice", () => {
    const r = validate(load("invalid-missing-fields.xml"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.message.includes("DocumentCurrencyCode"))).toBe(true);
    expect(r.errors.some((e) => e.message.includes("InvoiceLine"))).toBe(true);
  });

  it("handles empty or malformed XML gracefully", () => {
    const empty = validate("");
    expect(empty.valid).toBe(false);
    expect(empty.errors[0].message).toContain("Empty XML");

    const malformed = validate("<Invoice><cbc:ID>Unclosed");
    expect(malformed.valid).toBe(false);

    expect(() => importUBL("<NotAnInvoice></NotAnInvoice>")).toThrow(/root Invoice element not found/);
  });
});

describe("UBL importer", () => {
  it("parses the basic invoice correctly", () => {
    const inv = importUBL(load("invoice-basic.xml"));
    expect(inv.id).toBe("INV-2024-0042");
    expect(inv.currencyCode).toBe("EUR");
    expect(inv.seller.name).toBe("Nordwind Logistik GmbH");
    expect(inv.seller.taxId).toBe("DE812345678");
    expect(inv.buyer.address.countryCode).toBe("NL");
    expect(inv.lineItems).toHaveLength(2);
    expect(inv.totals.payableAmount).toBe("2406.00");
    expect(inv.taxBreakdowns).toHaveLength(2);
    expect(inv.paymentTerms?.payeeFinancialAccount).toBe("DE44250100901234567890");
  });

  it("maps credit note typeCode 381 and billing reference", () => {
    const inv = importUBL(load("credit-note.xml"));
    expect(inv.typeCode).toBe("381");
    expect(inv.references?.billingReference).toBe("INV-2024-0311");
    expect(parseFloat(inv.totals.payableAmount)).toBeLessThan(0);
  });

  it("captures reverse charge exemption details", () => {
    const inv = importUBL(load("reverse-charge.xml"));
    const tb = inv.taxBreakdowns![0];
    expect(tb.categoryCode).toBe("AE");
    expect(tb.exemptionReasonCode).toBe("Reverse charge");
    expect(tb.rate).toBe(0);
  });

  it("output always conforms to the canonical schema", () => {
    for (const name of validExamples) {
      const inv = importUBL(load(name));
      expect(CanonicalInvoiceSchema.safeParse(inv).success).toBe(true);
    }
  });
});

describe("UBL exporter", () => {
  it("produces XML that passes our validator", () => {
    for (const name of validExamples) {
      const xml = exportUBL(importUBL(load(name)));
      const r = validate(xml);
      expect(r.errors).toEqual([]);
    }
  });

  it("round-trips import→export→import stably", () => {
    for (const name of validExamples) {
      const first = importUBL(load(name));
      const second = importUBL(exportUBL(first));
      expect(normalize(second)).toEqual(normalize(first));
    }
  });

  it("emits PEPPOL customization + profile defaults", () => {
    const xml = exportUBL(importUBL(load("invoice-basic.xml")));
    expect(xml).toContain("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
    expect(xml).toContain("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2");
  });
});
