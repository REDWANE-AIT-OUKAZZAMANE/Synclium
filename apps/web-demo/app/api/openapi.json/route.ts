import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const openapiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Synclium API",
      version: "0.1.0",
      description:
        "High-performance, compiler-grade e-invoice transpiler and validation engine. Converts between European UBL / PEPPOL BIS 3.0, Franco-German Factur-X / ZUGFeRD, Saudi ZATCA Phase 2 (Fatoora), and Canonical AST with strict Schematron rule verification. All operations are strictly stateless and memory-isolated.",
      contact: {
        name: "Synclium Engineering",
        url: "https://synclium.com",
      },
      license: {
        name: "MIT",
        url: "https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/blob/main/LICENSE",
      },
    },
    servers: [
      {
        url: "https://synclium.com/api",
        description: "Production Web API",
      },
      {
        url: "http://localhost:3000/api",
        description: "Local Next.js Engine",
      },
      {
        url: "http://localhost:3001",
        description: "Fastify High-Throughput Daemon",
      },
    ],
    tags: [
      {
        name: "Transpilation",
        description: "Zero-loss invoice format conversion between national e-invoicing standards.",
      },
      {
        name: "Validation",
        description: "Structural XSD schema & EN16931 Schematron business rule verification.",
      },
      {
        name: "Extraction",
        description: "Multimodal AI extraction from unstructured invoice scans (PDF/PNG) to Canonical AST.",
      },
      {
        name: "Metadata",
        description: "Available formats, presets, sample datasets, and health checks.",
      },
    ],
    paths: {
      "/convert": {
        post: {
          tags: ["Transpilation"],
          summary: "Transpile e-invoice payload between standards",
          description:
            "Converts raw XML (UBL, Factur-X, ZATCA) or Canonical JSON AST into any target format. Format detection is automated when `from` is set to `auto`.",
          operationId: "convertInvoice",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConvertRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Transpilation successful",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConvertResponse",
                  },
                },
              },
            },
            "400": {
              description: "Bad Request (e.g. malformed JSON or unknown target format)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "422": {
              description: "Unprocessable Entity (Schematron or AST syntax error in invoice payload)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "429": {
              description: "Rate limit exceeded (30 requests/minute limit)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/validate": {
        post: {
          tags: ["Validation"],
          summary: "Validate invoice against Schematron and business rules",
          description:
            "Executes complete EN16931 rules, mandatory code lists, ZATCA Phase 2 NNPNESB validation, and allowance/charge reconciliation (BR-S-08).",
          operationId: "validateInvoice",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidateRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Validation results with error/warning report",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidateResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed request payload",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/extract": {
        post: {
          tags: ["Extraction"],
          summary: "Multimodal AI extraction from invoice scan (PDF/PNG/JPEG)",
          description:
            "Ingests base64-encoded PDF or image scans, runs multimodal LLM extraction, and outputs validated Canonical AST with per-field confidence metrics.",
          operationId: "extractInvoice",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ExtractRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Extracted invoice with confidence metrics",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ExtractResponse",
                  },
                },
              },
            },
            "400": {
              description: "Extraction failure or invalid base64 encoding",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/samples": {
        get: {
          tags: ["Metadata"],
          summary: "Fetch curated sample invoices across standards",
          description: "Returns ready-to-test XML payloads for UBL 2.1, Factur-X, and ZATCA Phase 2.",
          operationId: "getSamples",
          responses: {
            "200": {
              description: "Sample invoice collection",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      samples: {
                        type: "object",
                        additionalProperties: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              label: { type: "string" },
                              content: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/formats": {
        get: {
          tags: ["Metadata"],
          summary: "List supported format adapters",
          description: "Returns registered adapter identifiers, descriptions, and capabilities.",
          operationId: "getFormats",
          responses: {
            "200": {
              description: "Supported formats list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      formats: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "ubl" },
                            label: { type: "string", example: "UBL 2.1 / PEPPOL BIS Billing 3.0" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ConvertRequest: {
          type: "object",
          required: ["input", "to"],
          properties: {
            input: {
              type: "string",
              description: "Raw XML string or Canonical JSON string of the invoice.",
              example:
                '<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ...> ... </Invoice>',
            },
            from: {
              type: "string",
              enum: ["auto", "ubl", "facturx", "zatca", "canonical"],
              default: "auto",
              description: "Source format (default: auto-detected from XML namespace or root tag).",
              example: "auto",
            },
            to: {
              type: "string",
              enum: ["ubl", "facturx", "zatca", "canonical"],
              description: "Target format standard.",
              example: "zatca",
            },
          },
        },
        ConvertResponse: {
          type: "object",
          properties: {
            output: {
              type: "string",
              description: "Transpiled invoice string (XML formatted or Canonical JSON string).",
            },
            from: {
              type: "string",
              description: "Resolved source format.",
              example: "ubl",
            },
            to: {
              type: "string",
              description: "Target format applied.",
              example: "zatca",
            },
          },
        },
        ValidateRequest: {
          type: "object",
          required: ["input"],
          properties: {
            input: {
              type: "string",
              description: "Raw invoice XML or Canonical JSON payload.",
            },
            format: {
              type: "string",
              enum: ["auto", "ubl", "facturx", "zatca", "canonical"],
              default: "auto",
              description: "Invoice format standard to validate against.",
            },
          },
        },
        ValidateResponse: {
          type: "object",
          properties: {
            valid: {
              type: "boolean",
              description: "True if document passed all structural schemas and Schematron business rules.",
            },
            format: {
              type: "string",
              description: "Detected or evaluated format.",
            },
            errors: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IssueItem",
              },
            },
            warnings: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IssueItem",
              },
            },
          },
        },
        IssueItem: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "XPath or JSON path pointing to the issue location.",
              example: "cac:TaxTotal/cac:TaxSubtotal",
            },
            message: {
              type: "string",
              description: "Human-readable description of the validation failure.",
              example: "BR-S-08: Tax subtotal taxable amount must reconcile with document-level allowances.",
            },
            severity: {
              type: "string",
              enum: ["ERROR", "WARNING", "INFO"],
              example: "ERROR",
            },
            code: {
              type: "string",
              description: "Standard rule identifier (e.g. BR-S-08, BR-CO-10, ZATCA-01).",
              example: "BR-S-08",
            },
          },
        },
        ExtractRequest: {
          type: "object",
          required: ["contentBase64", "mimeType"],
          properties: {
            contentBase64: {
              type: "string",
              description: "Base64-encoded raw file content.",
            },
            mimeType: {
              type: "string",
              description: "MIME type (application/pdf, image/png, image/jpeg).",
              example: "application/pdf",
            },
            provider: {
              type: "string",
              enum: ["gemini", "anthropic", "mock"],
              default: "gemini",
              description: "AI extraction backend provider.",
            },
            filename: {
              type: "string",
              description: "Original filename for metadata logging.",
              example: "invoice-scan-2026.pdf",
            },
          },
        },
        ExtractResponse: {
          type: "object",
          properties: {
            needsReview: {
              type: "boolean",
              description: "Indicates if low-confidence fields require human verification in the loop.",
            },
            overallConfidence: {
              type: "number",
              description: "Normalized confidence score between 0.00 and 1.00.",
              example: 0.984,
            },
            fieldConfidence: {
              type: "object",
              additionalProperties: {
                type: "number",
              },
              description: "Per-field confidence scores.",
            },
            reviewReasons: {
              type: "array",
              items: { type: "string" },
            },
            invoice: {
              $ref: "#/components/schemas/CanonicalInvoice",
            },
            provider: {
              type: "string",
              example: "gemini",
            },
          },
        },
        CanonicalInvoice: {
          type: "object",
          required: ["id", "issueDate", "currency", "supplier", "customer", "lines", "totals"],
          properties: {
            id: { type: "string", example: "INV-2026-001" },
            issueDate: { type: "string", format: "date", example: "2026-08-23" },
            dueDate: { type: "string", format: "date", example: "2026-09-23" },
            currency: { type: "string", example: "EUR" },
            typeCode: { type: "string", example: "388" },
            supplier: {
              type: "object",
              properties: {
                name: { type: "string", example: "Acme Industrial Logistics" },
                vatId: { type: "string", example: "DE314982711" },
                taxScheme: { type: "string", example: "VAT" },
                endpointId: { type: "string", example: "0192:987654321" },
              },
            },
            customer: {
              type: "object",
              properties: {
                name: { type: "string", example: "Europa Rail AG" },
                vatId: { type: "string", example: "DE812345678" },
                taxScheme: { type: "string", example: "VAT" },
              },
            },
            lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", example: "1" },
                  name: { type: "string", example: "Rail Inverter Diagnostic" },
                  quantity: { type: "number", example: 1 },
                  unitCode: { type: "string", example: "HUR" },
                  unitPrice: { type: "number", example: 1500.0 },
                  lineExtensionAmount: { type: "number", example: 1500.0 },
                  taxCategory: { type: "string", example: "S" },
                  taxRate: { type: "number", example: 19.0 },
                },
              },
            },
            totals: {
              type: "object",
              properties: {
                lineExtensionAmount: { type: "number", example: 1500.0 },
                taxExclusiveAmount: { type: "number", example: 1500.0 },
                taxInclusiveAmount: { type: "number", example: 1785.0 },
                taxAmount: { type: "number", example: 285.0 },
                payableAmount: { type: "number", example: 1785.0 },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error description",
            },
            supported: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(openapiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
