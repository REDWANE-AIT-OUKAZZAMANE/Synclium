import { NextResponse } from "next/server";
import { createProvider } from "@openinvoicebridge/extract";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily persistent quota configuration
const DAILY_LIMIT = 3;

interface QuotaRecord {
  date: string; // YYYY-MM-DD
  used: number;
}

const inMemoryStore = new Map<string, QuotaRecord>();

// Determine a persistent storage file path
function getStoragePath(): string {
  const candidates = [
    path.join(process.cwd(), ".quota-db.json"),
    path.join(os.homedir(), ".synclium-quota-db.json"),
    path.join(os.tmpdir(), "synclium-quota-db.json"),
  ];
  for (const p of candidates) {
    try {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) {
        return p;
      }
    } catch {}
  }
  return candidates[0];
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
}

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

function readPersistentStore(): Record<string, QuotaRecord> {
  const filePath = getStoragePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  
  const obj: Record<string, QuotaRecord> = {};
  inMemoryStore.forEach((val, key) => {
    obj[key] = val;
  });
  return obj;
}

function writePersistentStore(store: Record<string, QuotaRecord>): void {
  // Always update in-memory cache
  Object.entries(store).forEach(([k, v]) => {
    inMemoryStore.set(k, v);
  });

  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

function getClientIdentifier(req: Request): string {
  let rawIp = "127.0.0.1";
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    rawIp = forwarded.split(",")[0].trim();
  } else {
    rawIp = req.headers.get("x-real-ip")?.trim() || req.headers.get("cf-connecting-ip")?.trim() || "127.0.0.1";
  }

  // Normalize localhost and IPv6 variants
  if (rawIp === "::1" || rawIp === "::ffff:127.0.0.1" || rawIp === "localhost" || rawIp.startsWith("127.")) {
    rawIp = "127.0.0.1";
  }

  const deviceFp = req.headers.get("x-client-fingerprint")?.trim() || "generic_client";
  return `${rawIp}__${deviceFp}`;
}

function checkAndConsumeQuota(identifier: string): {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  resetInSec: number;
} {
  const today = getTodayString();
  const resetInSec = getSecondsUntilMidnightUTC();
  const store = readPersistentStore();

  let record = store[identifier];
  if (!record || record.date !== today) {
    record = { date: today, used: 0 };
  }

  if (record.used >= DAILY_LIMIT) {
    store[identifier] = record;
    writePersistentStore(store);
    return {
      allowed: false,
      remaining: 0,
      used: record.used,
      limit: DAILY_LIMIT,
      resetInSec,
    };
  }

  // Consume 1 scan
  record.used += 1;
  store[identifier] = record;
  writePersistentStore(store);

  return {
    allowed: true,
    remaining: Math.max(0, DAILY_LIMIT - record.used),
    used: record.used,
    limit: DAILY_LIMIT,
    resetInSec,
  };
}

function peekQuota(identifier: string): {
  remaining: number;
  used: number;
  limit: number;
  resetInSec: number;
} {
  const today = getTodayString();
  const resetInSec = getSecondsUntilMidnightUTC();
  const store = readPersistentStore();

  const record = store[identifier];
  if (!record || record.date !== today) {
    return {
      remaining: DAILY_LIMIT,
      used: 0,
      limit: DAILY_LIMIT,
      resetInSec,
    };
  }

  return {
    remaining: Math.max(0, DAILY_LIMIT - record.used),
    used: record.used,
    limit: DAILY_LIMIT,
    resetInSec,
  };
}

/**
 * GET: Query current remaining quota for the client without consuming it
 */
export async function GET(req: Request) {
  const identifier = getClientIdentifier(req);
  const quota = peekQuota(identifier);

  return NextResponse.json(
    {
      remaining: quota.remaining,
      used: quota.used,
      limit: quota.limit,
      resetInSec: quota.resetInSec,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-RateLimit-Limit": String(quota.limit),
        "X-RateLimit-Remaining": String(quota.remaining),
        "X-RateLimit-Reset": String(quota.resetInSec),
      },
    },
  );
}

/**
 * POST: Stateless AI extraction — processes payload in-memory with server-side persistent quota enforcement.
 */
export async function POST(req: Request) {
  try {
    const identifier = getClientIdentifier(req);
    const quota = checkAndConsumeQuota(identifier);

    if (!quota.allowed) {
      const hours = Math.floor(quota.resetInSec / 3600);
      const mins = Math.floor((quota.resetInSec % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return NextResponse.json(
        {
          error: `Daily limit of ${DAILY_LIMIT} AI extractions reached. Your quota resets at 00:00 UTC (in ~${timeStr}).`,
          remaining: 0,
          used: quota.used,
          limit: DAILY_LIMIT,
          resetInSec: quota.resetInSec,
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "X-RateLimit-Limit": String(DAILY_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(quota.resetInSec),
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
          remaining: quota.remaining,
          used: quota.used,
          limit: DAILY_LIMIT,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "X-RateLimit-Limit": String(DAILY_LIMIT),
            "X-RateLimit-Remaining": String(quota.remaining),
            "X-RateLimit-Reset": String(quota.resetInSec),
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
