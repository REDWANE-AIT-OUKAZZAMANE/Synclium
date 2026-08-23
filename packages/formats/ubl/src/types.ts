import type { CanonicalInvoice, FormatValidationResult } from "@openinvoicebridge/core";

export type ValidationResult = FormatValidationResult;

export interface ImportResult {
  invoice: CanonicalInvoice;
  warnings: string[];
  extensions: Record<string, unknown>;
}
