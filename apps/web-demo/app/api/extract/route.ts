import { NextResponse } from "next/server";
import { createProvider } from "@openinvoicebridge/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Stateless AI extraction — the uploaded file is processed in memory and never stored.
 * Uses the mock provider when ANTHROPIC_API_KEY is absent and the caller allows fallback
 * (mock only handles OCR-like text).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      contentBase64?: string;
      mimeType?: string;
      provider?: string;
      filename?: string;
    };
    const { contentBase64, mimeType, provider: requested, filename } = body;

    if (!contentBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing 'contentBase64' or 'mimeType'" }, { status: 400 });
    }

    let providerName = requested ?? "anthropic";
    const hasKey = !!process.env.ANTHROPIC_API_KEY;

    if (providerName === "anthropic" && !hasKey) {
      if (mimeType.startsWith("text/")) {
        providerName = "mock"; // graceful demo fallback for text inputs
      } else {
        return NextResponse.json(
          {
            error:
              "AI extraction for PDFs/images requires an ANTHROPIC_API_KEY on the server. Text files work with the offline mock provider.",
          },
          { status: 503 },
        );
      }
    }

    try {
      const provider = createProvider(providerName);
      const data = Uint8Array.from(Buffer.from(contentBase64, "base64"));
      const result = await provider.extract({ data, mimeType, filename });
      return NextResponse.json({
        needsReview: result.needsReview,
        overallConfidence: Number(result.overallConfidence.toFixed(3)),
        fieldConfidence: result.fieldConfidence,
        reviewReasons: result.reviewReasons,
        invoice: result.invoice,
        provider: result.provider,
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
