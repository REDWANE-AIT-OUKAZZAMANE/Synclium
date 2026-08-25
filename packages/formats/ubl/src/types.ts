import type { CanonicalInvoice, FormatValidationResult } from "@synclium-com/core";

export type ValidationResult = FormatValidationResult;

export interface ImportResult {
  invoice: CanonicalInvoice;
  warnings: string[];
  extensions: Record<string, unknown>;
}
