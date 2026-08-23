import type { ExtractionProvider } from "./types.js";
import { DEFAULT_REVIEW_THRESHOLD, finalizeResult, type ExtractionInput, type ExtractionResult } from "./types.js";
import { buildExtractionPrompt, parseModelOutput } from "./prompt.js";

export interface AnthropicProviderOptions {
  /** Defaults to ANTHROPIC_API_KEY env var. */
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  reviewThreshold?: number;
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000). */
  timeoutMs?: number;
}

const SUPPORTED_MIME_PREFIXES = ["text/", "image/", "application/pdf"];

/**
 * Claude-backed extraction using the Messages API with a structured-output prompt.
 *
 * Implemented over plain fetch() — no SDK dependency — so this package stays light
 * and works in any Node >= 18 runtime.
 */
export class AnthropicProvider implements ExtractionProvider {
  readonly name = "anthropic";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly reviewThreshold: number;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: AnthropicProviderOptions = {}) {
    const key = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "AnthropicProvider requires an API key. Pass { apiKey } or set the ANTHROPIC_API_KEY environment variable.",
      );
    }
    this.apiKey = key;
    this.model = opts.model ?? "claude-sonnet-4-20250514";
    this.maxTokens = opts.maxTokens ?? 4096;
    this.reviewThreshold = opts.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD;
    this.baseUrl = opts.baseUrl ?? "https://api.anthropic.com";
    this.timeoutMs = opts.timeoutMs ?? 30000;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const mime = input.mimeType || "application/octet-stream";
    if (!SUPPORTED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
      throw new Error(`Unsupported MIME type for extraction: ${mime}. Supported: text/*, image/*, application/pdf`);
    }

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [
        {
          role: "user",
          content: [
            ...buildContentBlocks(input.data, mime),
            { type: "text", text: buildExtractionPrompt(this.reviewThreshold) },
          ],
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${detail.slice(0, 500)}`);
    }

    const payload: any = await res.json();
    const text = (payload.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    const { invoice, fieldConfidence } = parseModelOutput(text);
    return finalizeResult(this.name, invoice, fieldConfidence, this.reviewThreshold);
  }
}

function buildContentBlocks(data: Uint8Array, mime: string): unknown[] {
  if (mime.startsWith("image/")) {
    return [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mime,
          data: toBase64(data),
        },
      },
    ];
  }
  if (mime === "application/pdf") {
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: toBase64(data),
        },
      },
    ];
  }
  // Plain text (e.g. OCR output)
  return [{ type: "text", text: new TextDecoder().decode(data) }];
}

function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString("base64");
}
