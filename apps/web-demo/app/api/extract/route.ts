import { NextResponse } from "next/server";
import { createProvider } from "@openinvoicebridge/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Token protection: in-memory sliding window rate limiter
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 10;
const ipRequests = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (ipRequests.get(ip) ?? []).filter((t) => t > windowStart);
  
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const resetInSec = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    ipRequests.set(ip, timestamps);
    return { allowed: false, remaining: 0, resetInSec };
  }

  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length,
    resetInSec: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  };
}

/**
 * Stateless AI extraction — the uploaded file is processed in memory and never stored.
 * Protected by user rate limiting to preserve free tier AI model quota.
 */
export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "127.0.0.1";
    const limit = checkRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached to protect AI token quota. Please wait ${limit.resetInSec}s before uploading another document.`,
          remaining: 0,
          resetInSec: limit.resetInSec,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(limit.resetInSec),
          },
        },
      );
    }

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

    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    let providerName = requested;
    if (!providerName) {
      if (hasGemini) providerName = "gemini";
      else if (hasAnthropic) providerName = "anthropic";
      else if (mimeType.startsWith("text/")) providerName = "mock";
      else providerName = "gemini"; // default attempt
    }

    if (providerName === "gemini" && !hasGemini) {
      if (hasAnthropic) {
        providerName = "anthropic";
      } else if (mimeType.startsWith("text/")) {
        providerName = "mock";
      } else {
        return NextResponse.json(
          {
            error:
              "AI extraction for PDFs/images requires a free GEMINI_API_KEY (get a free key at https://aistudio.google.com) or ANTHROPIC_API_KEY on the server. Text files work with the offline mock provider.",
          },
          { status: 503 },
        );
      }
    }

    if (providerName === "anthropic" && !hasAnthropic) {
      if (hasGemini) {
        providerName = "gemini";
      } else if (mimeType.startsWith("text/")) {
        providerName = "mock";
      } else {
        return NextResponse.json(
          {
            error:
              "AI extraction for PDFs/images requires a free GEMINI_API_KEY (get a free key at https://aistudio.google.com) or ANTHROPIC_API_KEY on the server. Text files work with the offline mock provider.",
          },
          { status: 503 },
        );
      }
    }

    try {
      let provider = createProvider(providerName);
      const data = Uint8Array.from(Buffer.from(contentBase64, "base64"));
      
      let result;
      try {
        result = await provider.extract({ data, mimeType, filename });
      } catch (err: any) {
        // If Gemini is rate-limited (429) and Anthropic is configured, auto-fallback to Anthropic
        if (providerName === "gemini" && hasAnthropic) {
          try {
            const fallbackProvider = createProvider("anthropic");
            result = await fallbackProvider.extract({ data, mimeType, filename });
          } catch {
            throw err;
          }
        } else {
          throw err;
        }
      }

      return NextResponse.json(
        {
          needsReview: result.needsReview,
          overallConfidence: Number(result.overallConfidence.toFixed(3)),
          fieldConfidence: result.fieldConfidence,
          reviewReasons: result.reviewReasons,
          invoice: result.invoice,
          provider: result.provider,
          remaining: limit.remaining,
        },
        {
          headers: {
            "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
            "X-RateLimit-Remaining": String(limit.remaining),
            "X-RateLimit-Reset": String(limit.resetInSec),
          },
        },
      );
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
