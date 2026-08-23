import { z } from "zod";

/**
 * Canonical Invoice Schema � superset hub for all e-invoice formats.
 *
 * Design principles:
 * - Superset, not UBL-shaped: every format importer maps into this, exporter maps out.
 * - Lossless where possible; lossy fields go to `extensions` with provenance.
 * - All money amounts are decimal strings to avoid floating point drift, but zod coerces numbers too.
 * - Strict mode: unknown top-level keys rejected, but `extensions` allows per-format extras.
 */

// --- primitives --------------------------------------------------------------

export const CurrencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/)
  .describe("ISO 4217 currency code");

export const CountryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/)
  .describe("ISO 3166-1 alpha-2");

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("ISO 8601 date YYYY-MM-DD");

/**
 * Decimal amount, tolerant of numeric input (AI extraction, JSON payloads).
 * Numbers are preserved losslessly via String(); validated as ^-?\d+(\.\d{1,6})?$.
 */
export const AmountString = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
  .refine((s) => /^-?\d{1,15}(\.\d{1,6})?$/.test(s), {
    message: "Invalid decimal amount",
  });

const TaxCategoryCodeSchema = z
  .string()
  .describe("UNCL5305 / VAT category: S=Standard, Z=Zero, E=Exempt, AE=Reverse charge, K=Intra-community, G=Free export, O=Outside scope");

// --- address -----------------------------------------------------------------

export const AddressSchema = z.object({
  streetName: z.string().min(1).optional(),
  additionalStreetName: z.string().optional(),
  cityName: z.string().min(1).optional(),
  postalZone: z.string().optional(),
  countrySubentity: z.string().optional(),
  countryCode: CountryCodeSchema,
});

export type Address = z.infer<typeof AddressSchema>;

// --- contact -----------------------------------------------------------------

export const ContactSchema = z.object({
  name: z.string().optional(),
  telephone: z.string().optional(),
  electronicMail: z.string().email().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;

// --- party -------------------------------------------------------------------

export const PartyIdentifierSchema = z.object({
  schemeID: z.string().min(1).describe("e.g. 0088 for GLN, 9908 for VAT, 0002 for SIRET"),
  value: z.string().min(1),
});

export const PartySchema = z.object({
  name: z.string().min(1).describe("Legal name"),
  tradingName: z.string().optional(),
  identifiers: z.array(PartyIdentifierSchema).optional(),
  taxId: z.string().optional().describe("Primary VAT / Tax ID (shorthand)"),
  taxScheme: z.string().optional().describe("Tax scheme ID, e.g. VAT"),
  companyId: z.string().optional(),
  endpointId: z.string().optional().describe("PEPPOL endpoint / GLN"),
  endpointScheme: z.string().optional(),
  address: AddressSchema,
  contact: ContactSchema.optional(),
  legalEntity: z.string().optional(),
});

export type Party = z.infer<typeof PartySchema>;

// --- tax ---------------------------------------------------------------------

export const TaxSchema = z.object({
  categoryCode: TaxCategoryCodeSchema,
  rate: z.number().min(0).max(100).describe("Percent, e.g. 20 for 20%"),
  amount: AmountString.optional(),
  taxableAmount: AmountString.optional(),
  exemptionReason: z.string().optional(),
  exemptionReasonCode: z.string().optional(),
  scheme: z.string().optional().describe("Tax scheme, e.g. VAT"),
});

export type Tax = z.infer<typeof TaxSchema>;

// --- allowance/charge --------------------------------------------------------

export const AllowanceChargeSchema = z.object({
  chargeIndicator: z.boolean(),
  reason: z.string().optional(),
  reasonCode: z.string().optional(),
  amount: AmountString,
  baseAmount: AmountString.optional(),
  multiplierFactor: z.number().min(0).max(100).optional(),
  taxCategory: TaxSchema.optional(),
});

export type AllowanceCharge = z.infer<typeof AllowanceChargeSchema>;

// --- line item ---------------------------------------------------------------

export const LineItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().describe("Negative quantities are valid on credit notes"),
  unitCode: z.string().optional().describe("UNECERec20, e.g. C62, KGM, HUR"),
  unitPriceAmount: AmountString,
  lineExtensionAmount: AmountString,
  name: z.string().optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  itemCode: z.string().optional(),
  itemClassification: z.string().optional(),
  taxes: z.array(TaxSchema).min(1),
  allowanceCharges: z.array(AllowanceChargeSchema).optional(),
  periodStart: DateSchema.optional(),
  periodEnd: DateSchema.optional(),
  accountingCost: z.string().optional(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

// --- totals ------------------------------------------------------------------

export const TotalsSchema = z.object({
  lineExtensionAmount: AmountString,
  taxExclusiveAmount: AmountString,
  taxInclusiveAmount: AmountString,
  allowanceTotalAmount: AmountString.optional(),
  chargeTotalAmount: AmountString.optional(),
  prepaidAmount: AmountString.optional(),
  payableAmount: AmountString,
  roundingAmount: AmountString.optional(),
  taxTotalAmount: AmountString.optional(),
});

export type Totals = z.infer<typeof TotalsSchema>;

// --- tax breakdown (document-level) ------------------------------------------

export const TaxBreakdownSchema = z.object({
  categoryCode: TaxCategoryCodeSchema,
  rate: z.number().min(0).max(100),
  taxableAmount: AmountString,
  taxAmount: AmountString,
  exemptionReason: z.string().optional(),
  exemptionReasonCode: z.string().optional(),
});

export type TaxBreakdown = z.infer<typeof TaxBreakdownSchema>;

// --- payment terms -----------------------------------------------------------

export const FinancialAccountString = z.preprocess((val) => {
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const extracted = obj.iban ?? obj.id ?? obj.accountNumber ?? obj.accountID ?? obj.value ?? obj.number;
    if (typeof extracted === "string" && extracted.trim()) return extracted.trim();
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof extracted === "number") return String(extracted);
  }
  return val;
}, z.string().optional());

export const FinancialInstitutionString = z.preprocess((val) => {
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const extracted = obj.bic ?? obj.id ?? obj.name ?? obj.value ?? obj.branchID;
    if (typeof extracted === "string" && extracted.trim()) return extracted.trim();
  }
  return val;
}, z.string().optional());

export const PaymentMeansCodeString = z.preprocess((val) => {
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const extracted = obj.code ?? obj.id ?? obj.value ?? obj.typeCode;
    if (extracted !== undefined) return String(extracted).trim();
  }
  return val;
}, z.string().optional());

export const PaymentTermsSchema = z.object({
  note: z.string().optional(),
  paymentDueDate: DateSchema.optional(),
  paymentMeansCode: PaymentMeansCodeString.describe("UNCL4461, e.g. 30=credit transfer, 48=card"),
  payeeFinancialAccount: FinancialAccountString,
  payeeFinancialInstitution: FinancialInstitutionString,
});

export type PaymentTerms = z.infer<typeof PaymentTermsSchema>;

// --- references --------------------------------------------------------------

export const ReferenceString = z.preprocess((val) => {
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const extracted = obj.id ?? obj.value ?? obj.code ?? obj.reference;
    if (typeof extracted === "string" && extracted.trim()) return extracted.trim();
    if (typeof extracted === "number") return String(extracted);
  }
  return val;
}, z.string().optional());

export const ReferencesSchema = z.object({
  orderReference: ReferenceString,
  contractReference: ReferenceString,
  despatchDocumentReference: ReferenceString,
  billingReference: ReferenceString,
  projectReference: ReferenceString,
  buyerOrderReference: ReferenceString,
});

export type References = z.infer<typeof ReferencesSchema>;

// --- canonical invoice (root) ------------------------------------------------

export const CanonicalInvoiceSchema = z.object({
  schemaVersion: z.string().default("1.0").describe("Canonical invoice schema version"),
  id: z.string().min(1).describe("Invoice number / ID"),
  typeCode: z.string().default("380").describe("UNCL1001, 380=invoice, 381=credit note"),
  issueDate: DateSchema,
  dueDate: DateSchema.optional(),
  deliveryDate: DateSchema.optional(),
  taxPointDate: DateSchema.optional(),
  currencyCode: CurrencyCodeSchema,
  buyerReference: z.string().optional().describe("PEPPOL buyer reference"),
  seller: PartySchema,
  buyer: PartySchema,
  payee: PartySchema.optional(),
  lineItems: z.array(LineItemSchema).min(1),
  taxBreakdowns: z.array(TaxBreakdownSchema).optional(),
  totals: TotalsSchema,
  paymentTerms: PaymentTermsSchema.optional(),
  references: ReferencesSchema.optional(),
  notes: z.array(z.string()).optional(),
  allowanceCharges: z.array(AllowanceChargeSchema).optional(),
  extensions: z
    .record(z.unknown())
    .optional()
    .describe("Format-specific fields with no canonical equivalent. Keys should be namespaced, e.g. zatca:invoiceCounter"),
  profileId: z.string().optional().describe("PEPPOL profile / Factur-X profile / ZATCA compliance hint"),
  customizationId: z.string().optional(),
});

export type CanonicalInvoice = z.infer<typeof CanonicalInvoiceSchema>;

// helper to parse & throw with nice errors
export function parseCanonicalInvoice(data: unknown): CanonicalInvoice {
  return CanonicalInvoiceSchema.parse(data);
}

export function safeParseCanonicalInvoice(data: unknown) {
  return CanonicalInvoiceSchema.safeParse(data);
}
