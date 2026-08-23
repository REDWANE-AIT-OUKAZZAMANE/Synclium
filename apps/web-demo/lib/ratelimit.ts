import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  resetInSec: number;
  tier: "anon" | "auth";
  failClosed?: boolean;
  error?: string;
}

export interface GeneralRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSec: number;
  failClosed?: boolean;
}

// In-memory atomic store for local testing/dev when Upstash is not provisioned
class InMemoryRedisMock {
  private store = new Map<string, { count: number; expiresAt: number }>();

  async incr(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < now) {
      this.store.set(key, { count: 1, expiresAt: now + 86400 * 1000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < now) return null;
    return entry.count as unknown as T;
  }

  clear() {
    this.store.clear();
  }
}

const memoryMock = new InMemoryRedisMock();
let customRedisClient: { incr: (k: string) => Promise<number>; expire: (k: string, s: number) => Promise<number>; get: <T>(k: string) => Promise<T | null> } | null = null;
let upstashClient: Redis | null = null;

/** Set a custom or mock Redis client (useful for unit/integration testing) */
export function setRedisClientForTesting(client: typeof customRedisClient) {
  customRedisClient = client;
}

export function getRedisClient() {
  if (customRedisClient) return customRedisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    if (!upstashClient) {
      upstashClient = new Redis({ url, token });
    }
    return upstashClient;
  }

  // Fallback to local in-memory store in dev when Upstash is not configured
  return memoryMock;
}

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** Extract real client IP from reverse proxy headers */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return normalizeIp(first);
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp.trim());
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return normalizeIp(cfIp.trim());

  return "127.0.0.1";
}

export function normalizeIp(raw: string): string {
  if (raw === "::1" || raw === "::ffff:127.0.0.1" || raw === "localhost" || raw.startsWith("127.")) {
    return "127.0.0.1";
  }
  return raw;
}

/** Compute SHA-256 salted hash of client IP. Never persist or log raw IPs. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "synclium-default-secret-salt";
  return crypto.createHash("sha256").update(`${ip}::${salt}`).digest("hex");
}

export function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

export function getSecondsUntilNextMinute(): number {
  const now = new Date();
  return 60 - now.getUTCSeconds();
}

/**
 * Atomic quota consumption for /extract
 * Keys Redis atomically: scan:{tier}:{identifier}:{YYYY-MM-DD}
 * Sets 24h TTL on first increment.
 * Fail closed if Redis is unreachable.
 */
export async function checkAndConsumeExtractQuota(params: {
  githubUserId?: string | null;
  ip: string;
}): Promise<QuotaResult> {
  const today = getTodayUTC();
  const resetInSec = getSecondsUntilMidnightUTC();

  const isAuth = !!params.githubUserId;
  const tier: "anon" | "auth" = isAuth ? "auth" : "anon";

  const anonLimit = Number(process.env.RATE_LIMIT_ANON_DAILY || 1);
  const authLimit = Number(process.env.RATE_LIMIT_AUTH_DAILY || 3);
  const limit = isAuth ? authLimit : anonLimit;

  const identifier = isAuth ? String(params.githubUserId) : hashIp(params.ip);
  const key = `scan:${tier}:${identifier}:${today}`;

  try {
    const redis = getRedisClient();
    const count = await redis.incr(key);

    // Set 24h TTL on first increment to auto-expire
    if (count === 1) {
      await redis.expire(key, 86400);
    }

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        used: count,
        limit,
        resetInSec,
        tier,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      used: count,
      limit,
      resetInSec,
      tier,
    };
  } catch (err: any) {
    // FAIL CLOSED: Return 503 error if Redis is unreachable
    console.error("[RateLimit:FailClosed] Persistent store error:", err?.message || err);
    return {
      allowed: false,
      failClosed: true,
      remaining: 0,
      used: limit,
      limit,
      resetInSec,
      tier,
      error: "Rate limit service temporarily unavailable. Please try again shortly.",
    };
  }
}

/**
 * Peek current extract quota without consuming
 */
export async function peekExtractQuota(params: {
  githubUserId?: string | null;
  ip: string;
}): Promise<QuotaResult> {
  const today = getTodayUTC();
  const resetInSec = getSecondsUntilMidnightUTC();

  const isAuth = !!params.githubUserId;
  const tier: "anon" | "auth" = isAuth ? "auth" : "anon";

  const anonLimit = Number(process.env.RATE_LIMIT_ANON_DAILY || 1);
  const authLimit = Number(process.env.RATE_LIMIT_AUTH_DAILY || 3);
  const limit = isAuth ? authLimit : anonLimit;

  const identifier = isAuth ? String(params.githubUserId) : hashIp(params.ip);
  const key = `scan:${tier}:${identifier}:${today}`;

  try {
    const redis = getRedisClient();
    const val = await redis.get<number>(key);
    const count = val ? Number(val) : 0;

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      used: count,
      limit,
      resetInSec,
      tier,
    };
  } catch {
    return {
      allowed: true,
      remaining: limit,
      used: 0,
      limit,
      resetInSec,
      tier,
    };
  }
}

/**
 * General Rate Limiter for compute endpoints (/convert, /validate)
 * Limit: 30 requests/minute per IP hash
 */
export async function checkGeneralRateLimit(ip: string): Promise<GeneralRateLimitResult> {
  const limit = Number(process.env.RATE_LIMIT_GENERAL_PER_MIN || 30);
  const now = new Date();
  const minuteKey = `${now.toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
  const hashed = hashIp(ip);
  const key = `rate:gen:${hashed}:${minuteKey}`;
  const resetInSec = getSecondsUntilNextMinute();

  try {
    const redis = getRedisClient();
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 60);
    }

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetInSec,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      limit,
      resetInSec,
    };
  } catch {
    // Fail-open for compute-only infra endpoints if Redis drops, or return allowed
    return {
      allowed: true,
      remaining: 1,
      limit,
      resetInSec,
    };
  }
}

/**
 * Generate standard HTTP RateLimit headers
 */
export function buildRateLimitHeaders(quota: { limit: number; remaining: number; resetInSec: number }) {
  return {
    "X-RateLimit-Limit": String(quota.limit),
    "X-RateLimit-Remaining": String(quota.remaining),
    "X-RateLimit-Reset": String(quota.resetInSec),
    "Retry-After": String(quota.resetInSec),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}
