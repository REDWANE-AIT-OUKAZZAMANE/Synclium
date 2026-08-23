import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MockProvider } from "../src/mock.js";
import { finalizeResult } from "../src/types.js";

const evalDir = join(__dirname, "../../../examples/eval");

function loadCases(): { name: string; text: string; expected: any }[] {
  const cases: { name: string; text: string; expected: any }[] = [];
  for (const f of readdirSync(evalDir)) {
    if (f.endsWith(".txt")) {
      const base = f.replace(/\.txt$/, "");
      const expected = JSON.parse(readFileSync(join(evalDir, `${base}.expected.json`), "utf-8"));
      cases.push({ name: base, text: readFileSync(join(evalDir, f), "utf-8"), expected });
    }
  }
  return cases.sort((a, b) => a.name.localeCompare(b.name));
}

/** Flatten an object into leaf paths like "seller.name" / "lineItems[0].quantity". */
function flatten(obj: any, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => flatten(item, `${path}[${i}]`, out));
      if (v.length === 0) out[path] = [];
    } else if (v !== null && typeof v === "object") {
      flatten(v, path, out);
    } else {
      out[path] = v;
    }
  }
  return out;
}

/** Field-level accuracy: fraction of expected leaves that exactly match. */
export function scoreCase(actual: any, expected: any): { matched: number; total: number; misses: string[] } {
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

describe("mock extraction on the eval set", () => {
  it("achieves >= 90% field-level accuracy", () => {
    const provider = new MockProvider();
    let total = 0;
    let matched = 0;

    return (async () => {
      for (const c of loadCases()) {
        const res = await provider.extract({
          data: new TextEncoder().encode(c.text),
          mimeType: "text/plain",
        });
        // Schema conformance
        const s = scoreCase(res.invoice as any, c.expected);
        expect(s.misses, `${c.name} missed: ${s.misses.join(", ")}`).toEqual([]);
        total += s.total;
        matched += s.matched;
      }
      const accuracy = matched / total;
      expect(accuracy).toBeGreaterThanOrEqual(0.9);
    })();
  });

  it("flags low-confidence critical fields as needsReview", async () => {
    const provider = new MockProvider();
    const garbage = `INVOICE
Invoice No: X-1
Date: not-a-date
Seller:
Currency: ???`;
    const res = await provider.extract({ data: new TextEncoder().encode(garbage), mimeType: "text/plain" });
    // Missing seller name → below threshold
    expect(res.needsReview).toBe(true);
  });

  it("rejects non-text input", async () => {
    const provider = new MockProvider();
    await expect(
      provider.extract({ data: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" }),
    ).rejects.toThrow(/only supports text/);
  });
});

describe("finalizeResult", () => {
  it("marks review when a critical field is missing confidence", () => {
    const r = finalizeResult(
      "test",
      { id: "x" } as any,
      { id: 1, issueDate: 1, currencyCode: 1, "totals.payableAmount": 1 }, // seller.name + buyer.name missing
    );
    expect(r.needsReview).toBe(true);
    expect(r.reviewReasons.length).toBeGreaterThan(0);
  });
});
