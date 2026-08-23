import { NextResponse } from "next/server";
import { convert, FormatError, isFormatId, type FormatId } from "@synclium/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stateless conversion via the canonical hub — the payload is never stored. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { input?: string; from?: string; to?: string };
    const { input, from = "auto", to } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing 'input' (invoice content string)" }, { status: 400 });
    }
    if (!to || !isFormatId(to)) {
      return NextResponse.json(
        { error: `Unknown target format "${to}". Supported: ubl, facturx, zatca, canonical` },
        { status: 400 },
      );
    }

    let resolvedFrom: FormatId | "auto" = from as FormatId | "auto";

    // JSON input implies canonical source regardless of the selector
    if ((from === "auto" || from === "canonical") && input.trimStart().startsWith("{")) {
      resolvedFrom = "canonical";
    }

    try {
      const output = convert(input, resolvedFrom, to as FormatId);
      const detected = resolvedFrom === "auto" ? "auto-detected" : resolvedFrom;
      return NextResponse.json({ output, from: detected, to });
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
