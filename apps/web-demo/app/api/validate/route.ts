import { NextResponse } from "next/server";
import { validateFormat, FormatError, type FormatId } from "@openinvoicebridge/registry";
import { validateCanonicalInvoice } from "@openinvoicebridge/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateCanonicalJson(input: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return NextResponse.json({ error: "Input is not valid JSON" }, { status: 400 });
  }
  return NextResponse.json({ ...validateCanonicalInvoice(parsed), format: "canonical" });
}

/** Stateless validation — the payload is never stored. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { input?: string; format?: string };
    const { input, format = "auto" } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing 'input' (invoice content string)" }, { status: 400 });
    }

    if (format === "canonical") return validateCanonicalJson(input);

    // Auto: JSON → canonical, otherwise format sniffing
    if (format === "auto" && input.trimStart().startsWith("{")) {
      return validateCanonicalJson(input);
    }

    try {
      const result = validateFormat(input, format as FormatId | "auto");
      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof FormatError) {
        return NextResponse.json({ error: e.message }, { status: 422 });
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
