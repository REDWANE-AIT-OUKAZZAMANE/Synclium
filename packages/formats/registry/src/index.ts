import { readFileSync } from "node:fs";
import type { CanonicalInvoice, FormatValidationResult } from "@synclium-com/core";
import * as ubl from "@synclium-com/ubl";
import * as facturx from "@synclium-com/facturx";
import * as zatca from "@synclium-com/zatca";

export const SUPPORTED_FORMATS = ["ubl", "facturx", "zatca", "canonical"] as const;
export type FormatId = (typeof SUPPORTED_FORMATS)[number];

export interface FormatModule {
  import(xml: string): CanonicalInvoice;
  export(invoice: CanonicalInvoice): string;
  validate(raw: string): FormatValidationResult;
  label: string;
}

/**
 * The format registry. Adding a new format means:
 *  1. creating a package under packages/formats/<id> exporting import/export/validate
 *  2. adding it here
 * See CONTRIBUTING.md for the full walkthrough.
 */
export const FORMATS: Record<Exclude<FormatId, "canonical">, FormatModule> = {
  ubl: {
    ...ubl,
    label: "UBL 2.1 / PEPPOL BIS Billing 3.0",
  },
  facturx: {
    ...facturx,
    label: "Factur-X / ZUGFeRD (CII)",
  },
  zatca: {
    ...zatca,
    label: "ZATCA Fatoora XML (Saudi Arabia)",
  },
};

export function isFormatId(s: string): s is FormatId {
  return (SUPPORTED_FORMATS as readonly string[]).includes(s);
}

export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormatError";
  }
}

/** Detect the format of a raw XML invoice payload by content sniffing. */
export function detectFormat(content: string): Exclude<FormatId, "canonical"> {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("<")) {
    throw new FormatError(
      "Input does not look like structured XML. For PDFs or images use extraction first (`oib extract` / POST /extract).",
    );
  }
  if (trimmed.includes("CrossIndustryInvoice")) return "facturx";

  // ZATCA is UBL-based; disambiguate via KSA markers
  const zatcaMarkers = [
    /clearance:\s*1/i,
    /reporting:\s*1/i,
    /name="0[12]00000"/,
    /<cbc:ID>ICV<\/cbc:ID>/,
    /<cbc:ID>PIH<\/cbc:ID>/,
  ];
  if (trimmed.includes("<Invoice") && zatcaMarkers.some((r) => r.test(trimmed))) return "zatca";

  if (trimmed.includes("<Invoice")) return "ubl";
  if (trimmed.includes("CrossIndustryDocument") || trimmed.includes("InvoiceContext")) return "facturx";

  throw new FormatError(
    "Could not detect the invoice format. Supported XML formats: ubl, facturx, zatca. Pass the source format explicitly.",
  );
}

export function loadCanonical(pathOrJson: string): CanonicalInvoice {
  let raw = pathOrJson.trim();
  if (!raw.startsWith("{")) {
    raw = readFileSync(pathOrJson, "utf-8");
  }
  try {
    return JSON.parse(raw) as CanonicalInvoice;
  } catch (e) {
    throw new FormatError(`Invalid canonical JSON: ${(e as Error).message}`);
  }
}

/** Convert between any two supported formats via the canonical hub. */
export function convert(input: string, from: FormatId | "auto", to: FormatId): string {
  if (!isFormatId(to)) {
    throw new FormatError(`Unknown target format "${to}". Supported: ${SUPPORTED_FORMATS.join(", ")}`);
  }

  const resolvedFrom = from === "auto" ? detectFormat(input) : from;

  let canonical: CanonicalInvoice;
  if (resolvedFrom === "canonical") {
    canonical = loadCanonical(input);
  } else {
    canonical = FORMATS[resolvedFrom].import(input);
  }

  if (to === "canonical") {
    return JSON.stringify(canonical, null, 2);
  }
  return FORMATS[to].export(canonical);
}

/** Validate a raw payload against one of the format validators (auto-detects when "auto"). */
export function validateFormat(
  input: string,
  format: FormatId | "auto",
): FormatValidationResult & { format?: string } {
  if (format === "canonical") {
    throw new FormatError("Canonical validation is handled by @synclium-com/core (validateCanonicalInvoice).");
  }
  const resolved = format === "auto" ? detectFormat(input) : format;
  const mod = FORMATS[resolved];
  return { ...mod.validate(input), format: resolved };
}
