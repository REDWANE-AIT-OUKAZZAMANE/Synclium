# UBL 2.1 / PEPPOL BIS Billing 3.0 — implementation notes

The reference format implementation. Most modern mandates extend UBL, so new formats often
start by copying this package.

## Scope

PEPPOL BIS Billing 3.0 profile (EN 16931 compliant) plus generic UBL 2.1 invoices.

## Mapping highlights

| Canonical | UBL | Notes |
|---|---|---|
| invoice id / type | `cbc:ID` / `cbc:InvoiceTypeCode` | default 380 |
| parties | `AccountingSupplierParty` / `AccountingCustomerParty` / `PayeeParty` | identifiers keep `@schemeID` |
| line taxes | `cac:Item/cac:ClassifiedTaxCategory` | fallback to TaxSubtotal mapping |
| doc tax breakdown | `cac:TaxTotal/cac:TaxSubtotal` | incl. exemption reason/code |
| totals | `cac:LegalMonetaryTotal` | |
| payment | `PaymentTerms` + `PaymentMeans` + PayeeFinancialAccount | |
| references | Order/Contract/Despatch/Billing/Project references | |

## Lossy fields

- `extensions["ubl:*"]`: unknown top-level elements captured on import but **not** re-emitted
  on export (documented loss).
- Delivery location/address (only delivery *date* is canonicalized).
- Price base quantity and price allowances.
- TaxTotal with no subtotals: synthesized breakdown is approximate (rate inferred as 0).

## Validator rules implemented

Structural presence of: root Invoice + namespace, ID, IssueDate, DocumentCurrencyCode,
supplier/customer parties, ≥1 InvoiceLine, LegalMonetaryTotal. Warnings for missing
InvoiceTypeCode, TaxTotal, PEPPOL ProfileID/CustomizationID.

NOT implemented: full PEPPOL BIS rule set (BR-CO-*), XSD validation, schematron.
