# ZATCA Fatoora XML (Saudi Arabia) — implementation notes

ZATCA e-invoicing (Phase 2 "Integration") uses UBL 2.1 with mandatory KSA extensions.
This package **composes** `@synclium-com/ubl` rather than duplicating it:
import = UBL import + KSA extension extraction; export = UBL export + extension injection.

## Scope

- Standard tax invoices, credit notes, debit notes (name=`0100000`, clearance)
- Simplified invoices, credit notes, debit notes (name=`0200000`, reporting)
- Document type encoded via UNCL1001 body code: `388` invoice, `381` credit note, `383` debit note
- Profiles `clearance:1.0` / `reporting:1.0` preserved via extensions + ProfileID

## ZATCA-specific handling

| Data | Where | Canonical mapping |
|---|---|---|
| Invoice UUID | `cbc:UUID` | `extensions["zatca:uuid"]`; generated on export if absent |
| Invoice counter (ICV) | AdditionalDocumentReference ID=ICV | `extensions["zatca:ICV"]` |
| Previous invoice hash (PIH) | AdditionalDocumentReference ID=PIH | `extensions["zatca:PIH"]` |
| Invoice subtype | `cbc:InvoiceTypeCode/@name` | 7-digit NNPNESB bitmask: `01`=standard, `02`=simplified (positions 3-7 reserved for 3rd-party/nominal/export/summary/self-billed flags) |
| Signature placeholder | `ext:UBLExtensions` | stub injected on export (real signing requires certs — out of scope) |

## Lossy fields

- Cryptographic stamp / signature hash: not canonicalized (requires certificate material).
- QR code contents: not canonicalized (derived from signed invoice).
- `IssueTime`: not part of canonical schema yet.

## Validator rules implemented

All UBL structural checks **plus**: mandatory `cbc:ProfileID` (error), mandatory `cac:TaxTotal`
(error), InvoiceTypeCode `name` attribute presence (warning), unexpected profile values
(warning), PIH/ICV presence hints (warnings).

NOT implemented: XSD validation against ZATCA schemas, cryptographic stamp verification,
QR TLV parsing, clearance API integration (explicit v2+ non-goal).
