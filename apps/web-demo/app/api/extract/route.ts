import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createProvider } from "@synclium-com/extract";
import {
  getClientIp,
  checkAndConsumeExtractQuota,
  peekExtractQuota,
  buildRateLimitHeaders,
} from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET: Query current remaining quota and authentication tier without consuming quota
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clientIp = getClientIp(req);
    const githubUserId = (session?.user as any)?.id || null;

    const quota = await peekExtractQuota({ githubUserId, ip: clientIp });
    const headers = buildRateLimitHeaders(quota);

    return NextResponse.json(
      {
        remaining: quota.remaining,
        used: quota.used,
        limit: quota.limit,
        resetInSec: quota.resetInSec,
        tier: quota.tier,
        authenticated: !!session?.user,
        user: session?.user
          ? {
              name: session.user.name,
              login: (session.user as any).login,
              image: session.user.image,
            }
          : null,
      },
      { headers },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to query quota balance", remaining: 1, limit: 1 },
      { status: 500 },
    );
  }
}

/**
 * POST: Stateless AI extraction — verifies Turnstile challenge, authenticates session,
 * and enforces atomic, persistent Upstash Redis rate limiting.
 */
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const body = (await req.json()) as {
      contentBase64?: string;
      mimeType?: string;
      provider?: string;
      filename?: string;
      turnstileToken?: string;
    };

    const { contentBase64, mimeType, provider: requested, filename } = body;
    const turnstileToken = req.headers.get("x-turnstile-token") || body.turnstileToken;

    // 1. Bot Mitigation (Cloudflare Turnstile check)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          error: turnstileResult.error || "Turnstile bot challenge verification failed. Please try again.",
        },
        { status: 403 },
      );
    }

    // 2. Resolve Authenticated Session
    const session = await getServerSession(authOptions);
    const githubUserId = (session?.user as any)?.id || null;

    // 3. Persistent Atomic Rate Limiting
    const quota = await checkAndConsumeExtractQuota({ githubUserId, ip: clientIp });
    const rateLimitHeaders = buildRateLimitHeaders(quota);

    // Fail Closed: Return 503 if Redis is unreachable
    if (quota.failClosed) {
      return NextResponse.json(
        {
          error: quota.error || "Rate limit service is temporarily unavailable. Please try again shortly.",
        },
        { status: 503, headers: rateLimitHeaders },
      );
    }

    // 429 Rate Limit Exceeded
    if (!quota.allowed) {
      const hours = Math.floor(quota.resetInSec / 3600);
      const mins = Math.floor((quota.resetInSec % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      const isAnon = quota.tier === "anon";
      const message = isAnon
        ? `Daily limit of ${quota.limit} anonymous scan reached. Sign in with GitHub for 3 scans/day (resets in ~${timeStr}).`
        : `Daily limit of ${quota.limit} scans reached for your GitHub account (resets in ~${timeStr} at 00:00 UTC).`;

      return NextResponse.json(
        {
          error: message,
          remaining: 0,
          used: quota.used,
          limit: quota.limit,
          resetInSec: quota.resetInSec,
          tier: quota.tier,
          upgradeAvailable: isAnon,
        },
        { status: 429, headers: rateLimitHeaders },
      );
    }

    // 4. Validate Ingestion Payload
    if (!contentBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing 'contentBase64' or 'mimeType'" },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    let providerName = requested;
    if (!providerName) {
      if (hasGemini) providerName = "gemini";
      else if (hasAnthropic) providerName = "anthropic";
      else if (mimeType.startsWith("text/")) providerName = "mock";
      else providerName = "gemini";
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
          { status: 503, headers: rateLimitHeaders },
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
          { status: 503, headers: rateLimitHeaders },
        );
      }
    }

    // 5. Execute Extraction
    try {
      const provider = createProvider(providerName);
      const data = Uint8Array.from(Buffer.from(contentBase64, "base64"));

      let result;
      try {
        result = await provider.extract({ data, mimeType, filename });
      } catch (err: any) {
        // Auto-failover to Anthropic if Gemini 429 occurs
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
          remaining: quota.remaining,
          used: quota.used,
          limit: quota.limit,
          resetInSec: quota.resetInSec,
          tier: quota.tier,
        },
        { headers: rateLimitHeaders },
      );
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400, headers: rateLimitHeaders },
      );
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
