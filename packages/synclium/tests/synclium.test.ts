import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  convert,
  validateFormat,
  detectFormat,
  FORMATS,
  SUPPORTED_FORMATS,
  CanonicalInvoiceSchema,
  validateCanonicalInvoice,
  type CanonicalInvoice,
} from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ublXml = readFileSync(
  resolve(__dirname, "../../../examples/ubl/invoice-basic.xml"),
  "utf-8",
);
const zatcaXml = readFileSync(
  resolve(__dirname, "../../../examples/zatca/standard-invoice.xml"),
  "utf-8",
);
const facturxXml = readFileSync(
  resolve(__dirname, "../../../examples/facturx/en16931-full.xml"),
  "utf-8",
);

describe("synclium (all-in-one SDK)", () => {
  it("exports format discovery and registry metadata", () => {
    expect(SUPPORTED_FORMATS).toEqual(["ubl", "facturx", "zatca", "canonical"]);
    expect(Object.keys(FORMATS)).toEqual(["ubl", "facturx", "zatca"]);
  });

  it("detects formats correctly via detectFormat()", () => {
    expect(detectFormat(ublXml)).toBe("ubl");
    expect(detectFormat(zatcaXml)).toBe("zatca");
    expect(detectFormat(facturxXml)).toBe("facturx");
  });

  it("validates formats correctly via validateFormat()", () => {
    const ublRes = validateFormat(ublXml, "ubl");
    expect(ublRes.valid).toBe(true);

    const zatcaRes = validateFormat(zatcaXml, "zatca");
    expect(zatcaRes.valid).toBe(true);

    const facturxRes = validateFormat(facturxXml, "facturx");
    expect(facturxRes.valid).toBe(true);
  });

  it("transpiles across formats via convert()", () => {
    // UBL -> Factur-X
    const fxOut = convert(ublXml, "ubl", "facturx");
    expect(fxOut).toContain("CrossIndustryInvoice");

    // Factur-X -> ZATCA
    const zatcaOut = convert(facturxXml, "facturx", "zatca");
    expect(zatcaOut).toContain("cbc:InvoiceTypeCode");
    expect(zatcaOut).toContain('name="0100000"');

    // ZATCA -> Canonical JSON
    const canonicalJson = convert(zatcaXml, "zatca", "canonical");
    const parsed: CanonicalInvoice = JSON.parse(canonicalJson);
    expect(parsed.id).toBe("STD-TINV-2024-00917");

    // Canonical AST parses cleanly through CanonicalInvoiceSchema
    const parseRes = CanonicalInvoiceSchema.safeParse(parsed);
    expect(parseRes.success).toBe(true);

    // Canonical validation succeeds
    const valRes = validateCanonicalInvoice(parsed);
    expect(valRes.valid).toBe(true);
  });
});
