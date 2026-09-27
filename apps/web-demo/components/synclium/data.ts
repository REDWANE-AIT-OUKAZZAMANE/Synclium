/* Real Synclium product facts. Nothing here is invented:
   formats, pipeline stages, mandates, eval scores, repo layout
   mirror README.md, docs/, and packages/. */

export const STAGES = [
  { id: "ingest", label: "INGEST", detail: "root namespace sniff" },
  { id: "detect", label: "DETECT", detail: "ubl · facturx · zatca" },
  { id: "normalize", label: "NORMALIZE", detail: "canonical AST" },
  { id: "validate", label: "VALIDATE", detail: "structural + rules" },
  { id: "compile", label: "COMPILE", detail: "deterministic emit" },
  { id: "emit", label: "EMIT", detail: "target dialect" },
] as const;

export const FORMATS = [
  {
    id: "ubl",
    name: "UBL 2.1",
    sub: "PEPPOL BIS Billing 3.0",
    region: "EU / PEPPOL network",
    spec: "ISO/IEC 19845 · EN16931",
    node: "cbc:ID / cac:InvoiceLine",
  },
  {
    id: "canonical",
    name: "CANONICAL AST",
    sub: "Synclium hub schema",
    region: "inside the machine",
    spec: "Zod · JSON Schema · Ajv",
    node: "id / lineItems[] / totals",
  },
  {
    id: "facturx",
    name: "FACTUR-X",
    sub: "ZUGFeRD 2.2 · CII",
    region: "France / Germany",
    spec: "EN16931 · UN/CEFACT",
    node: "ram:ID / SupplyChainTrade",
  },
  {
    id: "zatca",
    name: "ZATCA",
    sub: "Fatoora Phase 2",
    region: "Saudi Arabia",
    spec: "clearance:1.0 · reporting:1.0",
    node: "cbc:UUID / ICV / PIH",
  },
] as const;

export const TRANSLATION_ROWS = [
  { field: "document.id", ubl: "cbc:ID → INV-2026-088", canonical: "id: INV-2026-088", cii: "ram:ID → INV-2026-088", zatca: "cbc:ID → INV-2026-088" },
  { field: "issue.date", ubl: "cbc:IssueDate", canonical: "issueDate", cii: "udt:DateTimeString @102", zatca: "cbc:IssueDate" },
  { field: "seller.tax", ubl: "PartyTaxScheme / CompanyID", canonical: "seller.taxId", cii: "SpecifiedTaxRegistration", zatca: "CompanyID · 15-digit" },
  { field: "line.tax", ubl: "ClassifiedTaxCategory", canonical: "taxes[] {code, rate}", cii: "ApplicableTradeTax", zatca: "TaxSubtotal / Category" },
  { field: "payable", ubl: "LegalMonetaryTotal", canonical: "totals.payableAmount", cii: "DuePayableAmount", zatca: "LegalMonetaryTotal" },
  { field: "clearance", ubl: "ProfileID · CustomizationID", canonical: "extensions[]", cii: "GuidelineParameter", zatca: "UUID · ICV · PIH" },
] as const;

export const MANDATES = [
  {
    id: "be",
    country: "BELGIUM",
    date: "JAN 01 2026",
    standard: "PEPPOL BIS Billing 3.0 (UBL 2.1)",
    clearance: "PEPPOL 4-corner network",
    support: "READY",
    ready: true,
    note: "B2B mandate. Import · export · validate live.",
  },
  {
    id: "pl",
    country: "POLAND",
    date: "FEB 01 2026",
    standard: "KSeF · FA_VAT logical structure",
    clearance: "National KSeF central clearance",
    support: "ADAPTER",
    ready: false,
    note: "Open package adapter — contribute the format.",
  },
  {
    id: "fr",
    country: "FRANCE",
    date: "SEP 01 2026",
    standard: "Factur-X / ZUGFeRD 2.2 (CII)",
    clearance: "PDP + PPF platform routing",
    support: "READY",
    ready: true,
    note: "Profiles MINIMUM → EN16931 mapped.",
  },
  {
    id: "sa",
    country: "SAUDI ARABIA",
    date: "PHASE 2 · WAVES 1–15",
    standard: "ZATCA Fatoora Phase 2 XML",
    clearance: "ZATCA clearance + reporting API",
    support: "READY",
    ready: true,
    note: "0100000 standard · 0200000 simplified.",
  },
  {
    id: "de",
    country: "GERMANY",
    date: "2025 → 2028",
    standard: "XRechnung 3.0 / ZUGFeRD",
    clearance: "B2B direct exchange",
    support: "READY",
    ready: true,
    note: "CII path shared with Factur-X.",
  },
] as const;

export const PASSPORT_STAMPS = [
  { code: "EN16931", label: "syntax + totals coherent", tone: "protocol" },
  { code: "PEPPOL BIS 3.0", label: "profile + customization present", tone: "protocol" },
  { code: "VAT S 19.00", label: "category + rate classified", tone: "paper" },
  { code: "ZATCA KSA", label: "UUID · ICV · PIH injected", tone: "signal" },
] as const;

export const REPO_TREE = [
  { path: "packages/core", desc: "canonical AST · zod + JSON schema" },
  { path: "packages/formats/ubl", desc: "reference dialect adapter" },
  { path: "packages/formats/facturx", desc: "CII adapter" },
  { path: "packages/formats/zatca", desc: "Fatoora adapter (wraps UBL)" },
  { path: "packages/formats/registry", desc: "detect · convert · validate" },
  { path: "packages/extract", desc: "Gemini · Claude · mock providers" },
  { path: "packages/cli", desc: "oib convert / validate / extract" },
  { path: "packages/api", desc: "Fastify · OpenAPI · stateless" },
  { path: "examples/", desc: "fixtures + 554-field eval set" },
] as const;

export const EVAL_ROWS = [
  { provider: "mock baseline", score: "100.0% · 554/554", note: "deterministic · CI-enforced" },
  { provider: "Gemini Flash", score: "96.9% · 537/554", note: "free tier · GEMINI_API_KEY" },
  { provider: "Claude 3.5 Sonnet", score: "97.8% · 542/554", note: "ANTHROPIC_API_KEY" },
] as const;

/* Small real fixture used by the live compiler + terminal fallback. */
export const SAMPLE_UBL = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>INV-2026-088</cbc:ID>
  <cbc:IssueDate>2026-08-23</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Nordwind Transit Systems GmbH</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>DE314982711</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Europa Rail AG</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="HUR">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Rail power inverter maintenance</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">1500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">1785.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">1785.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
