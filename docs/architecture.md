# Architecture

## The hub-and-spoke principle

Every format talks to exactly one thing: the canonical invoice schema in `packages/core`.
No format imports another format's code (the only exception: ZATCA reuses the UBL importer,
because ZATCA *is* UBL + KSA extensions). Consequences:

- Adding format #N never touches formats #1..N−1.
- Conversion is always `import → canonical → export` — O(1) adapters, not O(n²) converters.
- The canonical schema is a **superset**, shaped around the union of real-world fields, not
  around UBL (which would make every non-UBL importer fight it).

## Canonical schema

Defined once with zod (`packages/core/src/canonical.ts`). JSON Schema is generated from it
via `zod-to-json-schema` (`src/json-schema.ts`) and used by Ajv for a second, independent
validation pass (`src/validation.ts`) plus business-rule warnings (totals coherence,
qty×price coherence, tax-rate sanity).

Key decisions:

| Decision | Rationale |
|---|---|
| Amounts as decimal strings | No float drift across import→export round trips; `toFixed` normalization at the edges |
| Multiple taxes per line (`lineItems[].taxes[]`) | VAT/GST variance across countries; single-tax schemas are the #1 cause of lossy converters |
| `extensions` bag on the root | Format-specific data (ZATCA ICV/PIH/UUID…) survives conversion instead of being dropped |
| Business-rule checks produce **warnings**, schema violations **errors** | Converters should stay useful for imperfect real-world files; validators report, they don't gatekeep legality |

## Format packages

Each package under `packages/formats/*` is self-contained:

```
import(raw) → CanonicalInvoice
export(canonical) → raw string
validate(raw) → { valid, errors[], warnings[] }
```

XML parsing uses `fast-xml-parser` (fast, no native deps); building uses `xmlbuilder2`.

**Non-round-tripping is explicit.** Fields without a canonical home go to
`extensions["fmt:name"]`; anything that can't survive a round trip is stripped in tests'
`normalize()` and documented in `docs/formats/<format>.md`.

### Why ZATCA wraps UBL

ZATCA Fatoora XML is UBL 2.1 with mandatory KSA-specific extensions (UUID, ICV counter,
PIH hash chain, InvoiceTypeCode `name` attribute). Duplicating the UBL importer would be a
maintenance liability, so `formats/zatca` composes the UBL importer/exporter and adds:
extension extraction/injection, profile normalization (`reporting:1.0` / `clearance:1.0`),
and ZATCA-specific validation rules.

## AI extraction (`packages/extract`)

Provider-agnostic `ExtractionProvider` interface. Ships with:

- `AnthropicProvider` — Claude via the Messages API over plain `fetch()` (no SDK dep),
  PDF/image/text inputs, structured-output prompt with per-field confidence contract.
- `MockProvider` — deterministic regex parser for OCR-like text; powers offline demos,
  CI tests, and the eval baseline.

Every result carries per-field confidence, an aggregate score, and `needsReview`
(any critical field below threshold). The eval harness (`scripts/eval.ts`) scores
field-level accuracy against hand-verified expectations in `examples/eval/`.

## Frontends

Three thin frontends over the same registry (`packages/formats/registry`):

- **CLI** (`oib`) — commander; auto-detection via content sniffing; exit codes reflect validity.
- **REST API** — Fastify 4; OpenAPI generated from route schemas at `/docs`;
  rate-limited; strictly stateless.
- **Web demo** — Next.js App Router; server-side API routes call the workspace packages
  directly (no network hop to the API service).

## Testing strategy

- Golden-file round-trip tests per format against ≥5 real-world-shaped examples.
- One intentionally broken example per format asserting validator failures.
- Schema conformance test: every example's import output parses against zod.
- Extraction eval set with measurable field-level accuracy.
- CI (GitHub Actions): install → build (topological) → typecheck → test → CLI smoke test.

## Deliberate non-goals

See README. In short: no government clearance integrations, no legal certification claims,
no multi-tenancy. This keeps the project a clean interoperability layer others can build on.
