#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, basename, resolve, dirname } from "node:path";
import {
  SUPPORTED_FORMATS,
  convert,
  detectFormat,
  validateFormat,
  FormatError,
  isFormatId,
  FORMATS,
  type FormatId,
} from "@synclium-com/registry";
import { createProvider } from "@synclium-com/extract";
import { validateCanonicalInvoice } from "@synclium-com/core";

// Auto-load .env if available
if (typeof process.loadEnvFile === "function") {
  const rootEnv = resolve(process.cwd(), ".env");
  if (existsSync(rootEnv)) {
    try { process.loadEnvFile(rootEnv); } catch {}
  }
}

const program = new Command();

program
  .name("oib")
  .description("OpenInvoiceBridge — convert and validate e-invoices across formats (UBL/PEPPOL, Factur-X, ZATCA)")
  .version("0.1.0");

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

// OIB-002 / OIB-003: Safe path resolution and validation
function resolveSafePath(userPath: string, allowMissing = false): string {
  if (!userPath || typeof userPath !== "string") {
    fail("Path must be a non-empty string.");
  }
  if (userPath.includes("\0")) {
    fail("Path contains forbidden null bytes.");
  }
  const resolved = resolve(process.cwd(), userPath);
  if (!allowMissing && !existsSync(resolved)) {
    fail(`File does not exist: ${userPath}`);
  }
  return resolved;
}

function readInput(file: string): string {
  const safePath = resolveSafePath(file, false);
  try {
    return readFileSync(safePath, "utf-8");
  } catch (e) {
    console.error(`✖ Cannot read input file: ${file}`);
    console.error(`  ${(e as Error).message}`);
    process.exit(2);
  }
}

program
  .command("convert")
  .description("Convert an invoice between formats (via the canonical schema)")
  .argument("<input>", "input invoice file (XML or canonical JSON)")
  .requiredOption("-t, --to <format>", `target format (${SUPPORTED_FORMATS.join("|")})`)
  .option("-f, --from <format>", `source format (${SUPPORTED_FORMATS.join("|")}|auto)`, "auto")
  .option("-o, --output <file>", "write output to file instead of stdout")
  .action((inputFile: string, opts: { to: string; from: string; output?: string }) => {
    const input = readInput(inputFile);
    if (!isFormatId(opts.to)) {
      fail(`Unknown --to format "${opts.to}". Supported: ${SUPPORTED_FORMATS.join(", ")}`);
    }
    if (opts.from !== "auto" && !isFormatId(opts.from)) {
      fail(`Unknown --from format "${opts.from}". Supported: ${SUPPORTED_FORMATS.join(", ")}, auto`);
    }
    try {
      const out = convert(input, opts.from as FormatId | "auto", opts.to as FormatId);
      if (opts.output) {
        const safeOut = resolveSafePath(opts.output, true);
        const parentDir = dirname(safeOut);
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true });
        }
        writeFileSync(safeOut, out, "utf-8");
        console.log(`✔ Wrote ${opts.to} output to ${opts.output}`);
      } else {
        process.stdout.write(out + "\n");
      }
    } catch (e) {
      if (e instanceof FormatError) fail(e.message);
      const msg = (e as Error).message;
      fail(
        `Failed to convert: ${msg}\n` +
          `  Hint: run \`oib validate "${inputFile}"\` for a detailed structural check.`,
      );
    }
  });

program
  .command("validate")
  .description("Validate an invoice against a format's structural + business rules")
  .argument("<input>", "invoice file to validate")
  .option("-f, --format <format>", `${SUPPORTED_FORMATS.join("|")}|auto (default: auto-detect)`, "auto")
  .action((inputFile: string, opts: { format: string }) => {
    const input = readInput(inputFile);
    try {
      let result: { valid: boolean; errors: any[]; warnings?: any[]; format?: string };
      let formatLabel: string;

      if (opts.format === "canonical" || (opts.format === "auto" && inputFile.toLowerCase().endsWith(".json"))) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(input);
        } catch {
          fail("Input is not valid JSON — cannot validate as canonical.");
        }
        result = validateCanonicalInvoice(parsed);
        formatLabel = "canonical schema";
      } else {
        result = validateFormat(input, opts.format as FormatId | "auto");
        formatLabel = result.format ? FORMATS[result.format as "ubl"].label : opts.format;
      }

      console.log(`File:     ${inputFile}`);
      console.log(`Format:   ${formatLabel}`);
      console.log(`Valid:    ${result.valid ? "yes ✔" : "no ✖"}`);
      if (result.errors.length) {
        console.log("\nErrors:");
        for (const e of result.errors) console.log(`  ✖ [${e.path}] ${e.message}`);
      }
      if (result.warnings?.length) {
        console.log("\nWarnings:");
        for (const w of result.warnings) console.log(`  ⚠ [${w.path}] ${w.message}`);
      }
      process.exit(result.valid ? 0 : 1);
    } catch (e) {
      if (e instanceof FormatError) fail(e.message);
      fail((e as Error).message);
    }
  });

program
  .command("extract")
  .description("Extract invoice data from unstructured input (PDF/image/text) using AI")
  .argument("<input>", "PDF, image or text file")
  .option("-p, --provider <name>", "extraction provider: gemini|anthropic|mock", "gemini")
  .option("--model <model>", "model id (e.g. gemini-2.0-flash, claude-sonnet-4-20250514)")
  .option("--json-out <file>", "write full extraction report as JSON")
  .action(async (inputFile: string, opts: { provider: string; model?: string; jsonOut?: string }) => {
    const safeInput = resolveSafePath(inputFile, false);
    let data: Buffer;
    try {
      data = await readFile(safeInput);
    } catch (e) {
      fail(`Cannot read input file: ${(e as Error).message}`);
    }
    const ext = extname(safeInput).toLowerCase();
    const mimeType =
      ext === ".pdf" ? "application/pdf"
      : ext === ".png" ? "image/png"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : "text/plain";

    if (opts.provider === "gemini" && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      fail(
        "GEMINI_API_KEY is not set.\n" +
          "  Hint: get a free key at https://aistudio.google.com and export GEMINI_API_KEY=AIza...\n" +
          "  Or use --provider mock for offline text extraction, or --provider anthropic.",
      );
    }

    if (opts.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
      fail(
        "ANTHROPIC_API_KEY is not set.\n" +
          '  Hint: export ANTHROPIC_API_KEY=sk-... or use --provider gemini / --provider mock.',
      );
    }

    const provider = createProvider(opts.provider);
    console.error(`→ Extracting with provider "${provider.name}"${opts.model ? ` (model ${opts.model})` : ""}...`);
    try {
      const result = await provider.extract({
        data: new Uint8Array(data),
        mimeType,
        filename: basename(safeInput),
      });
      const report = {
        needsReview: result.needsReview,
        overallConfidence: Number(result.overallConfidence.toFixed(3)),
        reviewReasons: result.reviewReasons,
        fieldConfidence: Object.fromEntries(
          Object.entries(result.fieldConfidence).map(([k, v]) => [k, Number(v.toFixed(2))]),
        ),
        invoice: result.invoice,
      };
      if (opts.jsonOut) {
        const safeJsonOut = resolveSafePath(opts.jsonOut, true);
        const parentDir = dirname(safeJsonOut);
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true });
        }
        writeFileSync(safeJsonOut, JSON.stringify(report, null, 2), "utf-8");
        console.error(`✔ Report written to ${opts.jsonOut}`);
      }
      console.log(JSON.stringify(report.invoice, null, 2));
      console.error("");
      console.error(`Overall confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
      if (result.needsReview) {
        console.error("⚠ NEEDS REVIEW:");
        for (const r of result.reviewReasons) console.error(`  - ${r}`);
      } else {
        console.error("✔ Confidence above threshold — no human review flagged.");
      }
    } catch (e) {
      fail(`Extraction failed: ${(e as Error).message}`);
    }
  });

program
  .command("detect")
  .description("Detect the format of an invoice file")
  .argument("<input>", "invoice file")
  .action((inputFile: string) => {
    const input = readInput(inputFile);
    try {
      const f = detectFormat(input);
      console.log(`${f} — ${FORMATS[f].label}`);
    } catch (e) {
      fail((e as Error).message);
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
