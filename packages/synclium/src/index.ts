/**
 * Synclium — Universal e-invoice interoperability & synchronization engine
 *
 * All-in-one entrypoint exporting:
 * - Format conversion & transpilation: convert, validateFormat, detectFormat
 * - Format definitions & registry: FORMATS, SUPPORTED_FORMATS, FormatId, FormatModule
 * - Canonical invoice schema & AST: CanonicalInvoiceSchema, CanonicalInvoice, validateCanonicalInvoice
 */

// Format registry and conversion engine
export * from "@synclium/registry";

// Canonical AST, validation, schemas, and utility types
export * from "@synclium/core";
