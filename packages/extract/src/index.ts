export type {
  ExtractionProvider,
  ExtractionInput,
  ExtractionResult,
  FieldConfidence,
} from "./types.js";
export { DEFAULT_REVIEW_THRESHOLD, CRITICAL_FIELDS, finalizeResult } from "./types.js";
export { AnthropicProvider, type AnthropicProviderOptions } from "./anthropic.js";
export { MockProvider, parseOcrText } from "./mock.js";
export { buildExtractionPrompt, parseModelOutput, ExtractedInvoiceSchema } from "./prompt.js";

import type { ExtractionProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";

/**
 * Create an extraction provider by name.
 * - "mock": deterministic rule-based parser (offline demos/tests)
 * - "anthropic": Claude via the Anthropic API (requires ANTHROPIC_API_KEY)
 */
export function createProvider(name: string): ExtractionProvider {
  switch (name) {
    case "mock":
      return new MockProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw new Error(`Unknown extraction provider "${name}". Available: mock, anthropic`);
  }
}
