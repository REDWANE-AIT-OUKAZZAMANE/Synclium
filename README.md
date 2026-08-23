<div align="center">
  <img src="docs/assets/logo.png" alt="Synclium Logo" width="220" />
  <h1>Synclium</h1>
  <p><strong>Universal e-invoice interoperability & synchronization engine</strong></p>
  <p><em>One invoice in. Any international e-invoicing standard out.</em></p>

  <p>
    <a href="https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build Status" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-informational?style=flat-square" alt="Node" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/typescript-5.7-blue?style=flat-square" alt="TypeScript" /></a>
    <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-audited-success?style=flat-square" alt="Security Audited" /></a>
  </p>
</div>

---

**Synclium** (OpenInvoiceBridge) is an open-source universal e-invoicing interoperability engine. Feed it an invoice — structured XML (`UBL`, `Factur-X`, `ZATCA`), a PDF, or an image scan — and it validates and transpiles it across the world's major electronic invoicing formats using a single canonical intermediate schema as the hub.

> [!NOTE]
> **Technical Utility Notice**: Validation covers structural schema and business-rule checks. It does not replace official government tax authority clearance or certification for any country's mandate.

---

## Why Synclium?

Over a dozen countries are rolling out **mandatory e-invoicing between 2026 and 2027** — Belgium, Poland, France, Saudi Arabia, UAE, Malaysia, Morocco, Oman, Germany, and more. Every mandate requires distinct schema structures, tax category codes, and clearance workflows:

| Format / Dialect | Region / Mandate | Capabilities |
|---|---|---|
| **UBL 2.1 / PEPPOL BIS Billing 3.0** | EU / PEPPOL Network (`ISO/IEC 19845`) | Importer · Exporter · Schematron Validator |
| **Factur-X / ZUGFeRD 2.2 (CII)** | France / Germany (`EN16931`) | Importer · Exporter · Schematron Validator |
| **ZATCA Fatoora Phase 2** | Saudi Arabia (Tax & Customs Authority) | Importer · Exporter · Schematron Validator |
| *Custom / Emerging Format* | Cross-Border Networks | [Contribute a new format](CONTRIBUTING.md) |

---

## Architecture: Hub-and-Spoke Interoperability

Synclium uses a **hub-and-spoke architecture**: every format parser communicates with a single canonical intermediate AST, never directly with each other. Adding format $N+1$ requires 0 modifications to existing formats $1 \dots N$.

```
 UBL 2.1 (PEPPOL) ──import──▶ ┌───────────────────────────┐ ──export──▶ Factur-X / ZUGFeRD (CII)
                              │   Canonical Intermediate  │
 ZATCA Phase 2    ──import──▶ │         Invoice AST       │ ──export──▶ ZATCA Phase 2 XML
                              └───────────────────────────┘
 PDF / Scan / OCR ──AI extract (Gemini / Claude) ──▶ Canonical AST ──▶ Any Target XML
```

- **Canonical Schema** (`packages/core`): Zod-validated unified schema covering seller/buyer parties, line extensions, tax breakdowns, monetary totals, and payment identifiers.
- **Format Dialects** (`packages/formats/*`): Pure functional modules exporting `import()`, `export()`, and `validate()` with golden-file test matrices.
- **Multimodal AI Extraction** (`packages/extract`): Multimodal extraction with Google Gemini Flash (100% free tier) and Anthropic Claude 3.5 Sonnet fallback.
- **Unified Frontends**: CLI (`oib`), Fastify REST API, and Next.js Engineering Workbench.

---

## Quick Start

```bash
# Clone and install dependencies
git clone https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium.git
cd Synclium
pnpm install

# Build all packages topologically
pnpm build

# Run full test suite across workspace
pnpm test
```

---

### Command Line Interface (CLI)

```bash
# Convert between formats with automatic format detection
oib convert invoice.xml --to zatca

# Convert with explicit source/target and output file
oib convert invoice.xml --from ubl --to facturx -o output.xml

# Validate an invoice against format rules (exits with code 0 on success, 1 on errors)
oib validate invoice.xml --format facturx

# AI extraction from unstructured input (PDF, image scans, or OCR text)
oib extract invoice.pdf --json-out report.json          # Google Gemini Flash (GEMINI_API_KEY)
oib extract invoice.pdf --provider anthropic            # Claude 3.5 (ANTHROPIC_API_KEY)
oib extract ocr.txt --provider mock                     # Offline heuristic baseline
```

---

### REST API

```bash
# Start the Fastify API server
pnpm dev:api         # Listens on http://localhost:3000 (OpenAPI docs at /docs)
```

```bash
# Transpile payload via REST
curl -X POST http://localhost:3000/convert \
  -H 'Content-Type: application/json' \
  -d '{"input":"<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\">...","to":"canonical"}'
```

**Key Endpoints**:
- `POST /convert` — Transpile between any supported dialect or canonical JSON.
- `POST /validate` — Run Schematron and structural rule validation.
- `POST /extract` — AI document parsing (PDF, image, text).
- `GET /formats` — List active dialect specifications.
- `GET /healthz` — Service health telemetry.

---

### Web Demo Workbench

Launch the Next.js split-screen engineering workbench with dark/light themes, custom dialect selectors, and live confidence inspection:

```bash
pnpm dev:web         # Open http://localhost:3000
```

> **Zero Data Persistence Guarantee**: Uploaded invoice files, documents, and extracted payload contents are processed strictly in-memory and are never stored to disk, databases, or external storage. For upstream model protection, temporary rate-limiting counters (keyed by a salted SHA-256 IP hash or verified GitHub user ID) are stored in Redis with an automatic 24-hour expiration.

---

## Extraction Evaluation Benchmark

Tested across 10 multi-lingual enterprise invoices (**554 verified data fields**) in `examples/eval/`:

| Provider | Field-Level Accuracy | Pricing / Requirements |
|---|---|---|
| **Deterministic Mock Baseline** | **100.0%** (554/554) | Offline heuristic regex engine (CI test runner) |
| **Google Gemini Flash** | **96.9%** (537/554) | **Free Tier** via `GEMINI_API_KEY` ([aistudio.google.com](https://aistudio.google.com)) |
| **Anthropic Claude 3.5 Sonnet** | **97.8%** (542/554) | Requires `ANTHROPIC_API_KEY` |

```bash
pnpm --filter @synclium/extract eval            # Run mock baseline
pnpm --filter @synclium/extract eval:gemini     # Run Google Gemini Flash benchmark
pnpm --filter @synclium/extract eval:anthropic  # Run Claude benchmark
```

---

## Repository Structure

```
packages/
├── core/               Canonical schema (Zod + JSON Schema), validators, and types
├── formats/
│   ├── ubl/            UBL 2.1 / PEPPOL BIS Billing 3.0 (ISO/IEC 19845)
│   ├── facturx/        Factur-X / ZUGFeRD 2.2 (EN16931 / UN/CEFACT CII)
│   ├── zatca/          Saudi ZATCA Fatoora Phase 2 Tax Invoice XML
│   └── registry/       Unified format registry and converter pipeline
├── extract/            Multimodal AI extraction (Gemini + Anthropic + Mock)
├── cli/                `oib` command-line utility
└── api/                Fastify REST API + Swagger OpenAPI documentation
apps/
└── web-demo/           Next.js engineering workbench UI
examples/               Production invoice fixtures & evaluation dataset
docs/                   Architecture design notes & security specifications
```

---

## Security & Responsible Disclosure

Synclium implements strict XML entity protection (XXE and Billion Laughs mitigation), path traversal guards, rate-limiting, and zero data persistence. For vulnerability reports and security policies, please see [SECURITY.md](SECURITY.md).

---

## License

Released under the [MIT License](LICENSE).
