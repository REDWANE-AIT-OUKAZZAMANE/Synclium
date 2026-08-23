<div align="center">
  <img src="docs/assets/logo.png" alt="Synclium Logo" width="180" />
  <h1>Synclium</h1>
  <p><strong>Universal e-invoice interoperability & synchronization engine</strong></p>
  <p><em>One invoice in. Any e-invoicing standard out.</em></p>
</div>

---

Open-source universal e-invoice interoperability engine. Feed it an invoice — structured
XML (UBL, Factur-X, ZATCA…), a PDF, or even a scan — and it converts and validates it across
the world's major e-invoicing formats using a single canonical intermediate schema as the hub.

> ⚠️ **This is a technical utility, not certified compliance software.** Validation covers
> structural and business-rule checks only — it does not replace official clearance or
> certification for any country's mandate.

## Why

Over a dozen countries are rolling out **mandatory e-invoicing in 2026–2027** — Belgium,
Poland, France, Saudi Arabia, UAE, Malaysia, Morocco, Oman, Germany, and more. Every mandate
has its own format, validation rules, and clearance model:

| Format | Region | Status here |
|---|---|---|
| UBL 2.1 / PEPPOL BIS Billing 3.0 | EU / PEPPOL network | ✅ importer · exporter · validator |
| Factur-X / ZUGFeRD (CII) | France / Germany | ✅ importer · exporter · validator |
| ZATCA Fatoora XML | Saudi Arabia | ✅ importer · exporter · validator |
| *your format here* | … | 🚀 [see CONTRIBUTING.md](CONTRIBUTING.md) |

Any vendor operating across borders today builds one-off converters per country.
There is no open common layer. This repo is that layer.

**→ Contributing a new format is the whole point of this project.**
A new format package is ~a day of work following the template:
[CONTRIBUTING.md → Adding a format](CONTRIBUTING.md#adding-a-new-format).

## Live demo

Drag an invoice into the browser demo and see it converted + validated instantly.

```
https://openinvoicebridge.vercel.app        (deploy apps/web-demo with `vercel deploy`)
```

Nothing you drop in is stored — files are processed in memory and discarded.

## How it works

Hub-and-spoke: every format speaks to one canonical schema, never directly to each other.
Adding format #4 doesn't touch formats #1–3.

```
 UBL/PEPPOL ──import──▶ ┌────────────┐ ──export──▶ Factur-X/CII
                        │ canonical  │
 ZATCA XML  ──import──▶ │  invoice   │ ──export──▶ ZATCA XML
                        └────────────┘
 PDF/image  ──AI extract (Claude)──▶ canonical ──▶ any of the above
```

- **Canonical schema** (`packages/core`) — zod-defined superset covering parties, lines,
  multi-category taxes, totals, payment terms; JSON Schema generated from it.
- **Format packages** (`packages/formats/*`) — each exports `import()`, `export()`,
  `validate()` plus golden round-trip tests against real-world-shaped examples.
- **AI extraction** (`packages/extract`) — provider-agnostic interface; Claude via Anthropic
  API out of the box, deterministic mock provider for offline demos/tests.
- **CLI + REST API + web demo** — three frontends over the same engine.

## Quick start

```bash
pnpm install
pnpm build          # builds packages topologically
pnpm test           # vitest across all packages (golden-file tests)
```

### CLI

```bash
# Convert (format auto-detected from content)
oib convert invoice.xml --to zatca

# Explicit source/target
oib convert invoice.xml --from ubl --to facturx -o out.xml

# Validate (exit code reflects validity)
oib validate invoice.xml --format zatca

# AI extraction from unstructured input (PDFs, images, scans)
oib extract invoice.pdf --json-out report.json          # uses Gemini free tier (GEMINI_API_KEY)
oib extract invoice.pdf --provider anthropic            # uses Claude (ANTHROPIC_API_KEY)
oib extract ocr.txt --provider mock                     # offline heuristic provider
```

### REST API

```bash
pnpm dev:api         # http://localhost:3000/docs (Swagger UI)
```

```bash
curl -X POST localhost:3000/convert -H 'content-type: application/json' \
  -d '{"input":"<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\">…","to":"canonical"}'
```

Endpoints: `POST /convert` · `POST /validate` · `POST /extract` · `GET /formats`.
Rate-limited (60 req/min). **No uploaded invoice data is persisted** — everything is
processed in memory. Privacy matters when people test with real invoices.

## Extraction accuracy

Field-level accuracy on our hand-verified eval set (`examples/eval/`, 10 invoices,
**554 fields**):

| Provider | Field-level accuracy | Notes |
|---|---|---|
| `mock` (deterministic baseline) | **100%** (554/554) | by construction — regex parser over clean OCR-like text |
| `gemini` (Google Gemini 2.0 Flash) | run it yourself | **100% free tier** via `GEMINI_API_KEY` ([aistudio.google.com](https://aistudio.google.com)) |
| `anthropic` (Claude 3.7 / 3.5) | run it yourself | needs `ANTHROPIC_API_KEY`; record your result in a PR |

```bash
pnpm --filter @openinvoicebridge/extract eval            # mock baseline
pnpm --filter @openinvoicebridge/extract eval:gemini     # free Google Gemini Flash run
pnpm --filter @openinvoicebridge/extract eval:anthropic  # Claude run
```

The harness prints per-case field-level accuracy and every missed field path, so
regressions are immediately visible. The mock baseline is what CI enforces; the
Claude number is the honest one for messy, real-world documents.

## Repository layout

```
packages/
├── core/               canonical schema (zod + generated JSON Schema), validators, utils
├── formats/
│   ├── ubl/            UBL 2.1 / PEPPOL BIS Billing 3.0   ← reference implementation
│   ├── facturx/        Factur-X / ZUGFeRD (CII)
│   ├── zatca/          ZATCA Fatoora (Saudi Arabia)
│   └── registry/       shared registry + detect/convert/validate plumbing
├── extract/            AI extraction (Anthropic + mock), eval set & runner
├── cli/                `oib` command line tool
└── api/                Fastify REST API + OpenAPI docs
apps/web-demo/          Next.js drag-and-drop demo
examples/               sample invoices per format (+ invalid edge cases) + extraction eval set
docs/                   architecture notes & per-format implementation guides
```

## Non-goals (v1)

- No direct government API submission/clearance integration (v2+; varies per live infrastructure)
- No full legal compliance certification — see the warning at the top
- No multi-tenant auth/billing — open infrastructure, not SaaS

## Contributing

PRs welcome! Start with [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues are labeled
[`new format`](../../issues?q=label%3A%22new+format%22).

MIT licensed.
