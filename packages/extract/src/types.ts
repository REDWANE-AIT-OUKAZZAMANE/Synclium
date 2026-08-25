import type { CanonicalInvoice } from "@synclium-com/core";

/** Confidence for a single extracted field, keyed by canonical path (e.g. "seller.name"). */
export type FieldConfidence = Record<string, number>;

export interface ExtractionInput {
  /** Raw bytes of a PDF/image/text file. */
  data: Uint8Array;
  /** e.g. "application/pdf", "image/png", "text/plain" */
  mimeType: string;
  /** Optional filename hint. */
  filename?: string;
}

export interface ExtractionResult {
  /** Extracted invoice mapped into the canonical schema. */
  invoice: CanonicalInvoice;
  /** Per-field confidence in [0,1]. Absent fields have no entry. */
  fieldConfidence: FieldConfidence;
  /** Overall confidence = mean of per-field values. */
  overallConfidence: number;
  /** True when any critical field falls below `reviewThreshold`. */
  needsReview: boolean;
  /** Fields below threshold (or missing) that a human should check. */
  reviewReasons: string[];
  provider: string;
}

export interface ExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

export const DEFAULT_REVIEW_THRESHOLD = 0.7;

/**
 * Critical fields — if these are low-confidence or missing, the result needs human review.
 */
export const CRITICAL_FIELDS = [
  "id",
  "issueDate",
  "currencyCode",
  "seller.name",
  "buyer.name",
  "totals.payableAmount",
];

export function finalizeResult(
  provider: string,
  invoice: CanonicalInvoice,
  fieldConfidence: FieldConfidence,
  reviewThreshold: number = DEFAULT_REVIEW_THRESHOLD,
): ExtractionResult {
  const values = Object.values(fieldConfidence);
  const overallConfidence =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const reviewReasons: string[] = [];
  for (const f of CRITICAL_FIELDS) {
    const conf = fieldConfidence[f];
    if (conf === undefined || conf < reviewThreshold) {
      reviewReasons.push(`critical field "${f}" confidence ${conf ?? "missing"} < ${reviewThreshold}`);
    }
  }
  for (const [field, conf] of Object.entries(fieldConfidence)) {
    if (conf < reviewThreshold && !CRITICAL_FIELDS.includes(field)) {
      reviewReasons.push(`field "${field}" confidence ${conf.toFixed(2)} < ${reviewThreshold}`);
    }
  }

  return {
    invoice,
    fieldConfidence,
    overallConfidence,
    needsReview: reviewReasons.length > 0 || values.some((v) => v < reviewThreshold),
    reviewReasons,
    provider,
  };
}
