import type { FormatValidationResult } from "@synclium-com/core";
import { validate as validateUBL } from "@synclium-com/ubl";

export type ValidationResult = FormatValidationResult;

export function validate(xml: string): ValidationResult {
  const base = validateUBL(xml);
  const errors = [...base.errors];
  const warnings = [...base.warnings];

  // ZATCA-specific rules (schema + business rules, not full legal certification)
  if (!xml.includes("ProfileID") && !xml.includes("ProfileId")) {
    // UBL validator already warned, but escalate for ZATCA
  }
  // ZATCA requires ProfileID to be reporting:1.0 or clearance profile
  if (xml.includes("ProfileID")) {
    const profileMatch = xml.match(/<cbc:ProfileID[^>]*>([^<]+)<\/cbc:ProfileID>/);
    const profile = profileMatch?.[1]?.trim();
    if (profile && !profile.includes("reporting") && !profile.includes("clearance") && !profile.includes("zatca") && !profile.includes("urn:cen")) {
      warnings.push({ path: "/cbc:ProfileID", message: `Unexpected ZATCA ProfileID: ${profile} - expected reporting:1.0 or clearance profile` });
    }
  } else {
    errors.push({ path: "/cbc:ProfileID", message: "ZATCA requires cbc:ProfileID (reporting:1.0 for simplified, clearance for standard)" });
  }

  // UUID required for ZATCA
  if (!xml.includes("UUID") && !xml.includes("zatca:UUID") && !xml.includes("cbc:UUID")) {
    // Check for extensions
    if (!xml.includes("KSA") && !xml.includes("zatca")) {
      warnings.push({ path: "/cbc:UUID", message: "ZATCA expects UUID element (or via UBLExtensions). Will be generated on export if missing." });
    }
  }

  // InvoiceTypeCode must have name attribute indicating type (Standard vs Simplified)
  if (xml.includes("InvoiceTypeCode")) {
    const typeMatch = xml.match(/<cbc:InvoiceTypeCode[^>]*name=["\u0027]([^"\u0027]+)["\u0027][^>]*>/);
    if (!typeMatch) {
      warnings.push({ path: "/cbc:InvoiceTypeCode/@name", message: "ZATCA InvoiceTypeCode should have @name attribute (e.g. 0100000 for Standard)" });
    }
  }

  // VAT required
  if (!xml.includes("CompanyID") || !xml.includes("VAT")) {
    warnings.push({ path: "/cac:PartyTaxScheme", message: "ZATCA seller should have VAT number in PartyTaxScheme" });
  }

  // Currency SAR is common but not strictly required for export invoices
  if (!xml.includes("SAR") && !xml.includes("DocumentCurrencyCode")) {
    warnings.push({ path: "/cbc:DocumentCurrencyCode", message: "ZATCA invoices typically use SAR" });
  }

  // Check for required PreviousInvoiceHash, InvoiceCounter for simplified?
  if (xml.includes("Simplified") || xml.includes("388")) {
    if (!xml.includes("PreviousInvoiceHash") && !xml.includes("InvoiceCounter")) {
      warnings.push({ path: "/ext:UBLExtensions", message: "Simplified ZATCA invoice should include PreviousInvoiceHash and InvoiceCounter in UBLExtensions" });
    }
  }

  // Tax totals must exist
  if (!xml.includes("TaxTotal")) {
    errors.push({ path: "/cac:TaxTotal", message: "ZATCA requires TaxTotal" });
  }

  return { valid: errors.length === 0, errors, warnings };
}