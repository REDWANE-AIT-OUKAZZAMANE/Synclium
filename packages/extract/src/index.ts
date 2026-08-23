export type {
  ExtractionProvider,
  ExtractionInput,
  ExtractionResult,
  FieldConfidence,
} from "./types.js";
export { DEFAULT_REVIEW_THRESHOLD, CRITICAL_FIELDS, finalizeResult } from "./types.js";
export { AnthropicProvider, type AnthropicProviderOptions } from "./anthropic.js";
export { GeminiProvider, type GeminiProviderOptions } from "./gemini.js";
export { MockProvider, parseOcrText } from "./mock.js";
export { buildExtractionPrompt, parseModelOutput, ExtractedInvoiceSchema } from "./prompt.js";

import type { ExtractionProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { MockProvider } from "./mock.js";

/**
 * Create an extraction provider by name.
 * - "gemini": Google Gemini Flash multimodal (free tier via GEMINI_API_KEY)
 * - "anthropic": Claude via the Anthropic API (requires ANTHROPIC_API_KEY)
 * - "mock": deterministic rule-based parser (offline demos/tests)
 */
export function createProvider(name: string): ExtractionProvider {
  switch (name) {
    case "gemini":
      return new GeminiProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown extraction provider "${name}". Available: gemini, anthropic, mock`);
  }
}
