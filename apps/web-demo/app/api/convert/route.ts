import { NextResponse } from "next/server";
import { convert, FormatError, isFormatId, type FormatId } from "@synclium-com/registry";
import { getClientIp, checkGeneralRateLimit, buildRateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stateless conversion via the canonical hub — protected by 30 req/min general limiter. */
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await checkGeneralRateLimit(clientIp);
    const headers = buildRateLimitHeaders(rateCheck);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded (30 requests/minute). Please slow down.",
        },
        { status: 429, headers },
      );
    }

    const body = (await req.json()) as { input?: string; from?: string; to?: string };
    const { input, from = "auto", to } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing 'input' (invoice content string)" }, { status: 400, headers });
    }
    if (!to || !isFormatId(to)) {
      return NextResponse.json(
        { error: `Unknown target format "${to}". Supported: ubl, facturx, zatca, canonical` },
        { status: 400, headers },
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
      return NextResponse.json({ output, from: detected, to }, { headers });
    } catch (e) {
      if (e instanceof FormatError) {
        return NextResponse.json({ error: e.message }, { status: 422, headers });
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
