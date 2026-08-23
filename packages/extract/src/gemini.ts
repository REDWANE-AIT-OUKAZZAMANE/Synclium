import type { ExtractionProvider } from "./types.js";
import { DEFAULT_REVIEW_THRESHOLD, finalizeResult, type ExtractionInput, type ExtractionResult } from "./types.js";
import { buildExtractionPrompt, parseModelOutput } from "./prompt.js";

export interface GeminiProviderOptions {
  /** Defaults to GEMINI_API_KEY or GOOGLE_API_KEY env var. */
  apiKey?: string;
  model?: string;
  reviewThreshold?: number;
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 60000). */
  timeoutMs?: number;
}

const SUPPORTED_MIME_PREFIXES = ["text/", "image/", "application/pdf"];

// Default resilient fallback sequence across Google AI models
const DEFAULT_MODEL_FALLBACKS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
];

/**
 * Google Gemini Flash-backed extraction (multimodal PDF, image, text)
 * using the Google AI Gemini REST API with structured JSON output.
 *
 * Includes automatic model fallback cascade across models to bypass rate limits (429) and deprecations (404).
 */
export class GeminiProvider implements ExtractionProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly models: string[];
  private readonly reviewThreshold: number;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: GeminiProviderOptions = {}) {
    const key = opts.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error(
        "GeminiProvider requires an API key. Pass { apiKey } or set the GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable. Free keys are available at https://aistudio.google.com",
      );
    }
    this.apiKey = key;

    const primaryModel = opts.model ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
    this.models = Array.from(new Set([primaryModel, ...DEFAULT_MODEL_FALLBACKS]));
    this.reviewThreshold = opts.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD;
    this.baseUrl = opts.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    this.timeoutMs = opts.timeoutMs ?? 60000;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const mime = input.mimeType || "application/octet-stream";
    if (!SUPPORTED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
      throw new Error(`Unsupported MIME type for extraction: ${mime}. Supported: text/*, image/*, application/pdf`);
    }

    const parts = buildGeminiParts(input.data, mime, this.reviewThreshold);

    const body = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    let lastError: Error | null = null;
    let payload: any = null;

    // Try models in fallback cascade if rate-limited (429), not found (404), or overloaded (503)
    for (const model of this.models) {
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeoutMs),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");

            if (res.status === 429) {
              const retryMatch = detail.match(/retry in ([0-9.]+)s/i);
              const retrySecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
              lastError = new Error(
                `Google Gemini free tier quota exceeded on ${model} (retry in ~${retrySecs}s).`,
              );
              break; // Try next model in cascade
            }

            if (res.status === 404) {
              lastError = new Error(`Model ${model} is not available on this API key.`);
              break; // Try next model in cascade
            }

            if (res.status === 503) {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, attempt * 1000));
                continue;
              }
              lastError = new Error(`Model ${model} temporarily overloaded.`);
              break; // Try next model in cascade
            }

            lastError = new Error(`Google Gemini API error ${res.status}: ${detail.slice(0, 400)}`);
            break;
          }

          payload = await res.json();
          break;
        } catch (err: any) {
          lastError = err;
          break;
        }
      }

      if (payload) {
        break; // Successfully got response from one of the models
      }
    }

    if (!payload) {
      throw lastError ?? new Error("Failed to receive response from Gemini model cascade.");
    }

    const candidate = payload.candidates?.[0];
    if (!candidate?.content?.parts?.length) {
      throw new Error("Gemini returned an empty response or blocked content.");
    }

    const text = candidate.content.parts
      .map((p: any) => p.text ?? "")
      .join("\n");

    const { invoice, fieldConfidence } = parseModelOutput(text);
    return finalizeResult(this.name, invoice, fieldConfidence, this.reviewThreshold);
  }
}

function buildGeminiParts(data: Uint8Array, mime: string, reviewThreshold: number): unknown[] {
  const promptText = buildExtractionPrompt(reviewThreshold);

  if (mime.startsWith("image/") || mime === "application/pdf") {
    return [
      {
        inlineData: {
          mimeType: mime,
          data: Buffer.from(data).toString("base64"),
        },
      },
      { text: promptText },
    ];
  }

  // Plain text (e.g. OCR text)
  const textContent = new TextDecoder().decode(data);
  return [
    { text: `Document content:\n${textContent}\n\n${promptText}` },
  ];
}
