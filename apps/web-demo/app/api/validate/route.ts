import { NextResponse } from "next/server";
import { validateFormat, FormatError, type FormatId } from "@synclium-com/registry";
import { validateCanonicalInvoice } from "@synclium-com/core";
import { getClientIp, checkGeneralRateLimit, buildRateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateCanonicalJson(input: string, headers: Record<string, string>) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return NextResponse.json({ error: "Input is not valid JSON" }, { status: 400, headers });
  }
  return NextResponse.json({ ...validateCanonicalInvoice(parsed), format: "canonical" }, { headers });
}

/** Stateless validation — protected by 30 req/min general limiter. */
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

    const body = (await req.json()) as { input?: string; format?: string };
    const { input, format = "auto" } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing 'input' (invoice content string)" }, { status: 400, headers });
    }

    if (format === "canonical") return validateCanonicalJson(input, headers);

    // Auto: JSON → canonical, otherwise format sniffing
    if (format === "auto" && input.trimStart().startsWith("{")) {
      return validateCanonicalJson(input, headers);
    }

    try {
      const result = validateFormat(input, format as FormatId | "auto");
      return NextResponse.json(result, { headers });
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
