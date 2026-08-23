import type { FastifyInstance } from "fastify";
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
} from "@openinvoicebridge/registry";
import { createProvider } from "@openinvoicebridge/extract";

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
    provider: { type: "string", enum: ["gemini", "anthropic", "mock"], default: "gemini" },
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
              errors: { type: "array", items: { type: "object" } },
              warnings: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { input, format } = req.body as { input: string; format?: string };
      try {
        let result;
        let fmt: string;
        if (format === "canonical") {
          const inv = loadCanonical(input);
          const { validateCanonicalInvoice } = await import("@openinvoicebridge/core");
          result = validateCanonicalInvoice(inv);
          fmt = "canonical";
        } else {
          result = validateFormat(input, (format ?? "auto") as any);
          fmt = result.format ?? "unknown";
        }
        return { ...result, format: fmt };
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
      const { contentBase64, mimeType, provider: providerName, filename } = req.body as any;
      try {
        const defaultProvider =
          (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? "gemini"
          : process.env.ANTHROPIC_API_KEY ? "anthropic"
          : "gemini";
        const provider = createProvider(providerName ?? defaultProvider);
        const data = Uint8Array.from(Buffer.from(contentBase64, "base64"));
        const result = await provider.extract({ data, mimeType, filename });
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
