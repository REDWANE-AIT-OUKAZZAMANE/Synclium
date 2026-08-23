import type { FormatValidationResult } from "@synclium/core";

export type ValidationResult = FormatValidationResult;

export function validate(xml: string): ValidationResult {
  const errors: { path: string; message: string }[] = [];
  const warnings: { path: string; message: string }[] = [];

  if (!xml || xml.trim().length === 0) {
    errors.push({ path: "/", message: "Empty XML" });
    return { valid: false, errors, warnings };
  }
  if (!xml.includes("CrossIndustryInvoice") && !xml.includes("CrossIndustryDocument")) {
    errors.push({ path: "/", message: "Root must be CrossIndustryInvoice (Factur-X / ZUGFeRD CII)" });
  }
  if (!xml.includes("ExchangedDocument")) {
    errors.push({ path: "/ExchangedDocument", message: "Missing ExchangedDocument (invoice header)" });
  }
  if (!xml.includes("SupplyChainTradeTransaction")) {
    errors.push({ path: "/SupplyChainTradeTransaction", message: "Missing SupplyChainTradeTransaction" });
  }
  if (!xml.includes("ApplicableHeaderTradeAgreement")) {
    errors.push({ path: "/ApplicableHeaderTradeAgreement", message: "Missing seller/buyer agreement" });
  }
  if (!xml.includes("SpecifiedTradeSettlementHeaderMonetarySummation")) {
    errors.push({ path: "/SpecifiedTradeSettlementHeaderMonetarySummation", message: "Missing SpecifiedTradeSettlementHeaderMonetarySummation (totals)" });
  }
  if (!xml.includes("IncludedSupplyChainTradeLineItem")) {
    errors.push({ path: "/IncludedSupplyChainTradeLineItem", message: "Missing IncludedSupplyChainTradeLineItem — at least one line item required" });
  }
  if (!xml.includes("InvoiceCurrencyCode") && !xml.includes("CurrencyCode")) {
    errors.push({ path: "/InvoiceCurrencyCode", message: "Missing InvoiceCurrencyCode" });
  }
  if (!xml.includes("urn:un:unece:uncefact:data:standard:CrossIndustryInvoice")) {
    warnings.push({ path: "/", message: "Missing CII namespace � may not be Factur-X compliant" });
  }
  return { valid: errors.length === 0, errors, warnings };
}
