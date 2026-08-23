# Contributing to OpenInvoiceBridge

Thanks for your interest! This project lives or dies by the number of formats it supports,
so **adding a format is the single most valuable contribution you can make** — and we've
designed everything to make that a sub-day task.

## Setup

```bash
git clone <repo>
cd openinvoicebridge
pnpm install
pnpm build && pnpm test   # should pass before you start
```

Requirements: Node ≥ 18, pnpm ≥ 9.

## Adding a new format

The whole guide, using a hypothetical `pintmy` (Malaysia PINT / MyInvois) package. Copy any
existing format package (`packages/formats/ubl` is the reference implementation) and rename.

### 1. Create the package

```
packages/formats/pintmy/
├── package.json          name: @synclium/pintmy
├── tsconfig.json         extends ../../../tsconfig.base.json
├── vitest.config.ts      alias @synclium/core → ../../core/src/index.ts (copy from ubl)
├── src/
│   ├── importer.ts       pintmy XML → CanonicalInvoice
│   ├── exporter.ts       CanonicalInvoice → pintmy XML
│   ├── validator.ts      structural + business-rule checks
│   └── index.ts          export { import as import } … etc.
└── tests/
    └── golden.test.ts    round-trip golden tests
```

`package.json` essentials:

```json
{
  "name": "@synclium/pintmy",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "dependencies": {
    "@synclium/core": "workspace:*",
    "fast-xml-parser": "^4.5.1",
    "xmlbuilder2": "^3.1.1"
  }
}
```

### 2. The contract

Your `src/index.ts` re-exports the format functions:

```ts
export { importPINT as import } from "./importer.js";        // format XML → CanonicalInvoice
export { exportPINT as export } from "./exporter.js";        // CanonicalInvoice → format XML
export { validate } from "./validator.js";                   // raw XML → FormatValidationResult
```

The function signatures fulfill:

```ts
import type { CanonicalInvoice, FormatValidationResult } from "@synclium/core";

export function import(rawXml: string): CanonicalInvoice;
export function export(invoice: CanonicalInvoice): string;
export function validate(rawXml: string): FormatValidationResult;  // { valid, errors[], warnings[] }
```

Rules of thumb:

- **Import defensively.** Real-world files omit optional fields. Use the helpers pattern
  from `ubl/src/importer.ts` (`getText`, `asArray`, attribute readers).
- **Never throw on valid-but-unusual invoices** — put problems in `validate()` results instead.
- **Lossy fields go into `invoice.extensions["<fmt>:field"]`.** The canonical schema has an
  `extensions` bag for format-specific data with no cross-format equivalent (e.g. ZATCA's
  invoice counter). Exporters should re-hydrate from it when present. Never silently drop.
- Amounts are **decimal strings**, quantities are numbers, rates are percentage numbers,
  dates are `YYYY-MM-DD`, countries ISO-3166 alpha-2, currencies ISO-4217.

### 3. Examples

Add **at least 5 real-world-shaped examples** in `examples/<format>/` plus one intentionally
broken file prefixed `invalid-`:

```
examples/pintmy/
├── standard-invoice.xml
├── credit-note.xml
├── multiline-multitax.xml
├── simplified-b2c.xml
├── edge-minimal.xml
└── invalid-missing-fields.xml     ← validator must reject this
```

Base them on real spec samples (anonymized), not toy documents. Edge cases that matter:
credit notes/negative lines, multiple tax rates per line/document, reverse charge or exempt
categories, prepaid amounts, minimal legal fields only.

### 4. Golden tests

Copy `packages/formats/ubl/tests/golden.test.ts` and adapt. Three things are asserted for
every example:

1. `validate(example).valid === true` (and `invalid-*.xml` fails)
2. import output conforms to `CanonicalInvoiceSchema`
3. **round-trip stability**: `import(export(import(file)))` deep-equals `import(file)`
   after stripping documented non-round-tripping fields via `normalize()`

If a field doesn't round-trip (no canonical equivalent), strip it in `normalize()` and
document it in step 6. That's expected — silent loss is not.

### 5. Register the format

In `packages/formats/registry/src/index.ts`:

```ts
import * as pintmy from "@synclium/pintmy";

export const FORMATS = {
  // …existing…
  pintmy: { ...pintmy, label: "MyInvois PINT XML (Malaysia)" },
};
```

Add `"@synclium/pintmy": "workspace:*"` to the registry's `package.json`.
CLI (`oib convert --to pintmy`), API (`/convert {"to":"pintmy"}`) and web demo pick it up
automatically — no other changes needed. Extend `detectFormat()` if content sniffing can
distinguish your format.

### 6. Document it

Create `docs/formats/pintmy.md`:

- Spec/version covered + link to official documentation
- Profile/compliance levels supported
- Field-mapping table (canonical ↔ format) with lossy notes
- Validator rules implemented (and deliberately *not* implemented)

Then open a PR using the
[Add support for a format](/.github/ISSUE_TEMPLATE/add-format.yml) checklist.

## Other contributions

- **Core schema changes**: these affect all formats — open an issue first with the mapping
  impact per existing format.
- **Extraction providers**: implement `ExtractionProvider` in `packages/extract/src/types.ts`,
  register in `createProvider()`, add eval cases if measurable.
- **Docs & DX fixes**: always welcome.

## Conventions

- TypeScript strict mode everywhere; ESM only; `.js` suffixes in relative imports.
- No comments unless explaining a non-obvious domain decision (tax law quirks, format traps).
- Tests: vitest. Run `pnpm test`; CI runs typecheck/test/build/smoke-test on every PR.
- Commit style: conventional-ish prefixes (`feat(zatca):`, `fix(core):`, `docs:`).

## Code of conduct

Be decent. Review like you'd want to be reviewed: concrete, kind, focused on the code.
