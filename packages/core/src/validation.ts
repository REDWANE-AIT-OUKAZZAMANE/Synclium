import Ajv from "ajv";
import addFormats from "ajv-formats";
import { canonicalJsonSchema } from "./json-schema.js";
import { CanonicalInvoiceSchema } from "./canonical.js";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  path: string;
  message: string;
  severity: ValidationSeverity;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/** Simple issue shape returned by per-format validators. */
export interface FormatIssue {
  path: string;
  message: string;
}

/** Contract every format package's validate() must fulfill. */
export interface FormatValidationResult {
  valid: boolean;
  errors: FormatIssue[];
  warnings: FormatIssue[];
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateCanonical = ajv.compile(canonicalJsonSchema);

/**
 * Validate a plain JS object against the canonical JSON Schema + Zod + business rules.
 */
export function validateCanonicalInvoice(data: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Zod first for better messages
  const zodResult = CanonicalInvoiceSchema.safeParse(data);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      errors.push({
        path: issue.path.join("."),
        message: issue.message,
        severity: "error",
        code: issue.code,
      });
    }
    return { valid: false, errors, warnings };
  }

  // AJV check (redundant but ensures generated schema is correct)
  const ajvValid = validateCanonical(data);
  if (!ajvValid && validateCanonical.errors) {
    for (const e of validateCanonical.errors) {
      errors.push({
        path: e.instancePath || e.schemaPath,
        message: e.message ?? "Schema validation failed",
        severity: "error",
        code: e.keyword,
      });
    }
  }

  // Business rules
  const inv = zodResult.data;

  // Totals coherence checks (warn, not error � rounding)
  const lineSum = inv.lineItems.reduce((acc, li) => acc + parseFloat(li.lineExtensionAmount), 0);
  const lineTotal = parseFloat(inv.totals.lineExtensionAmount);
  if (Math.abs(lineSum - lineTotal) > 0.02) {
    warnings.push({
      path: "totals.lineExtensionAmount",
      message: `Sum of lineExtensionAmounts (${lineSum.toFixed(2)}) != totals.lineExtensionAmount (${lineTotal.toFixed(2)})`,
      severity: "warning",
      code: "TOTALS_MISMATCH",
    });
  }

  // Each line: qty * unitPrice ~= lineExtensionAmount (allow 1c rounding per line)
  for (let i = 0; i < inv.lineItems.length; i++) {
    const li = inv.lineItems[i];
    const expected = li.quantity * parseFloat(li.unitPriceAmount);
    const actual = parseFloat(li.lineExtensionAmount);
    if (Math.abs(expected - actual) > 0.02) {
      warnings.push({
        path: `lineItems[${i}].lineExtensionAmount`,
        message: `quantity (${li.quantity}) * unitPrice (${li.unitPriceAmount}) = ${expected.toFixed(2)} != lineExtensionAmount (${li.lineExtensionAmount})`,
        severity: "warning",
        code: "LINE_TOTAL_MISMATCH",
      });
    }
  }

  // Currency required
  if (!inv.currencyCode) {
    errors.push({
      path: "currencyCode",
      message: "currencyCode is required",
      severity: "error",
    });
  }

  // Tax breakdown coherence if present
  if (inv.taxBreakdowns) {
    for (let i = 0; i < inv.taxBreakdowns.length; i++) {
      const tb = inv.taxBreakdowns[i];
      const taxable = parseFloat(tb.taxableAmount);
      const tax = parseFloat(tb.taxAmount);
      const expectedTax = taxable * (tb.rate / 100);
      if (tb.rate > 0 && Math.abs(expectedTax - tax) > 0.02) {
        warnings.push({
          path: `taxBreakdowns[${i}].taxAmount`,
          message: `taxable ${taxable} * rate ${tb.rate}% = ${expectedTax.toFixed(2)} != taxAmount ${tb.taxAmount}`,
          severity: "warning",
          code: "TAX_MISMATCH",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
