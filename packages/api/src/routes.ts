import type { FastifyInstance } from "fastify";
import { basename } from "node:path";
import {
  SUPPORTED_FORMATS,
  FORMATS,
  convert,
  validateFormat,
  detectFormat,
  FormatError,
  isFormatId,
  loadCanonical,
  type FormatId,
} from "@synclium-com/registry";
import { createProvider } from "@synclium-com/extract";

const MAX_STRING_PAYLOAD_BYTES = 3 * 1024 * 1024; // 3MB maximum string length

const issueItemSchema = {
  type: "object",
  properties: {
    path: { type: "string" },
    message: { type: "string" },
    severity: { type: "string" },
    code: { type: "string" },
  },
  additionalProperties: true,
} as const;

const convertBody = {
  type: "object",
  required: ["input", "to"],
  properties: {
    input: { type: "string", description: "Raw invoice payload (XML string or canonical JSON string)" },
    from: { type: "string", enum: [...SUPPORTED_FORMATS, "auto"], default: "auto" },
    to: { type: "string", enum: SUPPORTED_FORMATS },
  },
} as const;

const validateBody = {
  type: "object",
  required: ["input"],
  properties: {
    input: { type: "string" },
    format: { type: "string", enum: [...SUPPORTED_FORMATS, "auto"], default: "auto" },
  },
} as const;

const extractBody = {
  type: "object",
  required: ["contentBase64", "mimeType"],
  properties: {
    contentBase64: { type: "string", description: "Base64-encoded PDF, image, or text invoice" },
    mimeType: { type: "string", description: "e.g. application/pdf, image/png, text/plain" },
    provider: { type: "string", enum: ["gemini", "anthropic", "mock"] },
    filename: { type: "string" },
  },
} as const;

export function buildRoutes(app: FastifyInstance) {
  app.get(
    "/healthz",
    {
      schema: {
        response: { 200: { type: "object", properties: { ok: { type: "boolean" }, version: { type: "string" } } } },
      },
    },
    async () => ({ ok: true, version: "0.1.0" }),
  );

  app.get(
    "/formats",
    {
      schema: {
        description:
          "List supported formats. NOTE: this is a technical utility, not a certified compliance product — validation covers schema and business-rule structure only.",
        response: {
          200: {
            type: "object",
            properties: {
              formats: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => ({
      formats: Object.entries(FORMATS).map(([id, m]) => ({ id, label: m.label })),
    }),
  );

  app.post(
    "/convert",
    {
      schema: {
        body: convertBody,
        response: {
          200: {
            type: "object",
            properties: {
              output: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { input, from, to } = req.body as { input: string; from?: string; to: string };
      
      if (typeof input !== "string" || Buffer.byteLength(input, "utf-8") > MAX_STRING_PAYLOAD_BYTES) {
        return reply.code(413).send({ error: "Payload exceeds maximum allowed size (3MB limit)." });
      }

      if (!isFormatId(to)) {
        return reply.code(400).send({ error: `Unknown target format "${to}"`, supported: SUPPORTED_FORMATS });
      }
      try {
        const resolvedFrom = from === "auto" || !from ? detectFormat(input) : (from as FormatId);
        const output = convert(input, resolvedFrom, to as FormatId);
        return { output, from: resolvedFrom, to };
      } catch (e) {
        if (e instanceof FormatError) return reply.code(422).send({ error: e.message });
        return reply.code(400).send({ error: (e as Error).message });
      }
    },
  );

  app.post(
    "/validate",
    {
      schema: {
        body: validateBody,
        response: {
          200: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              format: { type: "string" },
              errors: {
                type: "array",
                items: issueItemSchema,
              },
              warnings: {
                type: "array",
                items: issueItemSchema,
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { input, format } = req.body as { input: string; format?: string };
      
      if (typeof input !== "string" || Buffer.byteLength(input, "utf-8") > MAX_STRING_PAYLOAD_BYTES) {
        return reply.code(413).send({ error: "Payload exceeds maximum allowed size (3MB limit)." });
      }

      try {
        let result: { valid: boolean; errors: any[]; warnings?: any[]; format?: string };
        let fmt: string;

        if (format === "canonical") {
          const inv = loadCanonical(input);
          const { validateCanonicalInvoice } = await import("@synclium-com/core");
          result = validateCanonicalInvoice(inv);
          fmt = "canonical";
        } else {
          result = validateFormat(input, (format ?? "auto") as any);
          fmt = result.format ?? "unknown";
        }

        // Fix OIB-004: Explicitly map error/warning objects so fast-json-stringify serializes all fields
        const serializedErrors = (result.errors || []).map((e: any) => ({
          path: String(e.path ?? ""),
          message: String(e.message ?? ""),
          severity: e.severity ? String(e.severity) : undefined,
          code: e.code ? String(e.code) : undefined,
        }));

        const serializedWarnings = (result.warnings || []).map((w: any) => ({
          path: String(w.path ?? ""),
          message: String(w.message ?? ""),
          severity: w.severity ? String(w.severity) : undefined,
          code: w.code ? String(w.code) : undefined,
        }));

        return {
          valid: result.valid,
          format: fmt,
          errors: serializedErrors,
          warnings: serializedWarnings,
        };
      } catch (e) {
        if (e instanceof FormatError) return reply.code(422).send({ error: e.message });
        return reply.code(400).send({ error: (e as Error).message });
      }
    },
  );

  app.post(
    "/extract",
    {
      schema: {
        description:
          "Extract an unstructured invoice (PDF/image/text) into the canonical schema using AI. No uploaded data is stored.",
        body: extractBody,
      },
    },
    async (req, reply) => {
      const { contentBase64, mimeType, provider: requestedProvider, filename } = req.body as any;
      try {
        // Fix OIB-006: Sanitize filename to prevent path traversal
        const safeFilename = filename
          ? basename(String(filename)).replace(/[^a-zA-Z0-9._-]/g, "_")
          : "document.bin";

        // Fix OIB-012: Correct provider fallback order
        let providerName = requestedProvider;
        if (!providerName) {
          if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
            providerName = "gemini";
          } else if (process.env.ANTHROPIC_API_KEY) {
            providerName = "anthropic";
          } else {
            providerName = "mock";
          }
        }

        const provider = createProvider(providerName);
        const data = Uint8Array.from(Buffer.from(contentBase64, "base64"));
        const result = await provider.extract({ data, mimeType, filename: safeFilename });
        
        return {
          needsReview: result.needsReview,
          overallConfidence: Number(result.overallConfidence.toFixed(3)),
          fieldConfidence: result.fieldConfidence,
          reviewReasons: result.reviewReasons,
          invoice: result.invoice,
          provider: result.provider,
        };
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }
    },
  );
}
