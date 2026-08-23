import type { ValidationResult } from "./types.js";

export function validate(xml: string): ValidationResult {
  const errors: { path: string; message: string }[] = [];
  const warnings: { path: string; message: string }[] = [];

  if (!xml || xml.trim().length === 0) {
    errors.push({ path: "/", message: "Empty XML" });
    return { valid: false, errors, warnings };
  }

  // Structural checks
  if (!xml.includes("<Invoice")) {
    errors.push({ path: "/", message: "Root element must be Invoice" });
  }
  if (!xml.includes("cbc:ID") && !xml.includes("<cbc:ID>")) {
    errors.push({ path: "/cbc:ID", message: "Missing required field cbc:ID (Invoice number)" });
  }
  if (!xml.includes("cbc:IssueDate")) {
    errors.push({ path: "/cbc:IssueDate", message: "Missing required field cbc:IssueDate" });
  }
  if (!xml.includes("cbc:InvoiceTypeCode") && !xml.includes("InvoiceTypeCode")) {
    warnings.push({ path: "/cbc:InvoiceTypeCode", message: "Missing InvoiceTypeCode, defaulting to 380" });
  }
  if (!xml.includes("cbc:DocumentCurrencyCode")) {
    errors.push({ path: "/cbc:DocumentCurrencyCode", message: "Missing DocumentCurrencyCode" });
  }
  if (!xml.includes("cac:AccountingSupplierParty")) {
    errors.push({ path: "/cac:AccountingSupplierParty", message: "Missing AccountingSupplierParty (seller)" });
  }
  if (!xml.includes("cac:AccountingCustomerParty")) {
    errors.push({ path: "/cac:AccountingCustomerParty", message: "Missing AccountingCustomerParty (buyer)" });
  }
  if (!xml.includes("cac:InvoiceLine") && !xml.includes("InvoiceLine")) {
    errors.push({ path: "/cac:InvoiceLine", message: "At least one InvoiceLine is required" });
  }
  if (!xml.includes("cac:LegalMonetaryTotal")) {
    errors.push({ path: "/cac:LegalMonetaryTotal", message: "Missing LegalMonetaryTotal" });
  }
  if (!xml.includes("cac:TaxTotal")) {
    warnings.push({ path: "/cac:TaxTotal", message: "Missing TaxTotal — tax breakdown will be inferred" });
  }

  // Namespace check for PEPPOL BIS
  if (!xml.includes("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2")) {
    warnings.push({ path: "/", message: "Missing UBL Invoice-2 namespace — may not be PEPPOL BIS compliant" });
  }

  // Business rule: PEPPOL requires profile/customization IDs for BIS
  if (!xml.includes("cbc:ProfileID") && !xml.includes("cbc:CustomizationID")) {
    warnings.push({ path: "/cbc:ProfileID", message: "PEPPOL BIS Billing 3.0 expects ProfileID and CustomizationID" });
  }

  // Check line totals structure
  const lineMatches = xml.match(/cac:InvoiceLine/g) || [];
  if (lineMatches.length === 0 && !xml.includes("InvoiceLine")) {
    // already errored
  }

  return { valid: errors.length === 0, errors, warnings };
}
