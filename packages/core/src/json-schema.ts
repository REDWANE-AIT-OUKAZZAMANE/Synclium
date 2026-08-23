import { zodToJsonSchema } from "zod-to-json-schema";
import { CanonicalInvoiceSchema } from "./canonical.js";

export function getCanonicalJsonSchema() {
  return zodToJsonSchema(CanonicalInvoiceSchema, {
    name: "CanonicalInvoice",
    target: "jsonSchema7",
  });
}

// For Ajv validation — generate once
export const canonicalJsonSchema = getCanonicalJsonSchema();
