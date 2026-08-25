/**
 * Extraction eval runner.
 *
 *   pnpm --filter @synclium-com/extract eval
 *   pnpm --filter @synclium-com/extract eval:anthropic   # needs ANTHROPIC_API_KEY
 *
 * Scores field-level accuracy across examples/eval/*.txt against their
 * hand-verified *.expected.json files.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createProvider } from "../src/index.js";

// Auto-load .env if present
if (typeof process.loadEnvFile === "function") {
  const rootEnv = resolve(process.cwd(), "../../.env");
  if (existsSync(rootEnv)) {
    try { process.loadEnvFile(rootEnv); } catch {}
  } else if (existsSync(".env")) {
    try { process.loadEnvFile(".env"); } catch {}
  }
}

interface Case {
  name: string;
  data: Uint8Array;
  expected: any;
}

function loadCases(dir: string): Case[] {
  const cases: Case[] = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".txt")) continue;
    const base = f.replace(/\.txt$/, "");
    cases.push({
      name: base,
      data: new TextEncoder().encode(readFileSync(join(dir, f), "utf-8")),
      expected: JSON.parse(readFileSync(join(dir, `${base}.expected.json`), "utf-8")),
    });
  }
  return cases;
}

function flatten(obj: any, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) v.forEach((item, i) => flatten(item, `${path}[${i}]`, out));
    else if (v !== null && typeof v === "object") flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

function score(actual: any, expected: any) {
  const exp = flatten(expected);
  const act = flatten(actual);
  let matched = 0;
  const misses: string[] = [];
  for (const [k, v] of Object.entries(exp)) {
    if (act[k] === v) matched++;
    else misses.push(k);
  }
  return { matched, total: Object.keys(exp).length, misses };
}

async function main() {
  const args = process.argv.slice(2);
  const providerName = args.includes("--provider") ? args[args.indexOf("--provider") + 1] : "mock";
  const jsonOut = args.includes("--json");
  const evalDir = join(process.cwd(), "../../examples/eval");

  const provider = createProvider(providerName);
  const cases = loadCases(evalDir);

  console.log(`Extraction eval — provider=${provider.name}, cases=${cases.length}\n`);

  const results: any[] = [];
  let totalMatched = 0;
  let totalFields = 0;

  for (const c of cases) {
    try {
      const res = await provider.extract({ data: c.data, mimeType: "text/plain" });
      const s = score(res.invoice as any, c.expected);
      totalMatched += s.matched;
      totalFields += s.total;
      const pct = ((s.matched / s.total) * 100).toFixed(1);
      console.log(`${c.name.padEnd(12)} ${pct}%  (${s.matched}/${s.total})${s.misses.length ? `  missed: ${s.misses.join(", ")}` : ""}`);
      results.push({ case: c.name, matched: s.matched, total: s.total, misses: s.misses });
    } catch (err: any) {
      totalFields += 1; // count as fully failed
      console.error(`${c.name.padEnd(12)} ERROR: ${err.message}`);
      results.push({ case: c.name, error: err.message });
    }
    if (provider.name !== "mock") {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const accuracy = totalFields ? (totalMatched / totalFields) * 100 : 0;
  console.log(`\nField-level accuracy: ${accuracy.toFixed(1)}% (${totalMatched}/${totalFields})`);

  if (jsonOut) {
    writeFileSync(
      join(evalDir, `eval-report-${provider.name}.json`),
      JSON.stringify({ provider: provider.name, accuracy, results }, null, 2),
    );
    console.log(`Report written to examples/eval/eval-report-${provider.name}.json`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
