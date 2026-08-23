# Factur-X / ZUGFeRD — implementation notes

CII-based hybrid standard (France/Germany). This package handles the XML payload
(`rsm:CrossIndustryInvoice`). PDF attachment/embedding of the CII file is out of scope for v1.

## Scope

Profiles supported for mapping: MINIMUM, BASIC WL, BASIC, EN 16931 (COMFORT).
Profile is preserved via `ExchangedDocumentContext/GuidelineSpecifiedDocumentContextParameter`.

## Mapping highlights

| Canonical | CII | Notes |
|---|---|---|
| dates | `udt:DateTimeString @format="102"` | converted both ways (`20240510` ↔ `2024-05-10`) |
| seller/buyer | `ram:SellerTradeParty` / `ram:BuyerTradeParty` | tax registration via `SpecifiedTaxRegistration @schemeID="VA"` |
| line taxes | `SpecifiedLineTradeSettlement/ApplicableTradeTax` | |
| doc taxes | `ApplicableHeaderTradeSettlement/ApplicableTradeTax` | BasisAmount + CalculatedAmount + CategoryCode |
| totals | `SpecifiedTradeSettlementHeaderMonetarySummation` | DuePayableAmount → `payableAmount` |
| payment | `SpecifiedTradePaymentTerms` + `SpecifiedTradeSettlementPaymentMeans` | IBAN mapped |

## Lossy fields

- `ram:CreditorReferenceID`, `ram:PaymentReference` are not canonicalized.
- GrossPrice→NetPrice discount logic collapses to net unit price.
- Line-level period/accounting data ignored.
- `profileId` defaults on export when absent (tests normalize it).

## Validator rules implemented

Structural: CrossIndustryInvoice root + namespace, ExchangedDocument, SupplyChainTradeTransaction,
header agreement/settlement/monetary summation, ≥1 line item, currency code.
Warning: missing CII namespace.

NOT implemented: profile-level BR rules (BR-FX-*), Factur-X conformance levels checking,
PDF/A attachment verification.
