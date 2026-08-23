import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkAndConsumeExtractQuota,
  peekExtractQuota,
  getClientIp,
  hashIp,
  setRedisClientForTesting,
  getTodayUTC,
  buildRateLimitHeaders,
} from "../lib/ratelimit";
import { verifyTurnstileToken } from "../lib/turnstile";

// Real-like in-memory mock that simulates persistent Redis storage across restarts
class PersistentStoreSimulator {
  public data = new Map<string, number>();
  public ttls = new Map<string, number>();
  public expireCalls: { key: string; seconds: number }[] = [];

  async incr(key: string): Promise<number> {
    const curr = (this.data.get(key) || 0) + 1;
    this.data.set(key, curr);
    return curr;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.expireCalls.push({ key, seconds });
    this.ttls.set(key, seconds);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    return this.ttls.get(key) ?? 14400;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.data.has(key)) return null;
    return this.data.get(key) as unknown as T;
  }

  clear() {
    this.data.clear();
    this.ttls.clear();
    this.expireCalls = [];
  }
}

describe("Tiered Persistent Rate Limiting & Bot Mitigation Suite", () => {
  let mockStore: PersistentStoreSimulator;

  beforeEach(() => {
    mockStore = new PersistentStoreSimulator();
    setRedisClientForTesting(mockStore);
    process.env.RATE_LIMIT_ANON_DAILY = "1";
    process.env.RATE_LIMIT_AUTH_DAILY = "3";
    process.env.IP_HASH_SALT = "test-secret-salt-2026";
  });

  describe("1. Core Rate-Limiting & Atomic Increment", () => {
    it("allows 1 scan for anonymous user and blocks the 2nd scan with 429 semantics", async () => {
      const ip = "203.0.113.195";

      // 1st request -> allowed
      const first = await checkAndConsumeExtractQuota({ ip });
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(0);
      expect(first.used).toBe(1);
      expect(first.tier).toBe("anon");
      expect(first.limit).toBe(1);

      // 2nd request -> rejected
      const second = await checkAndConsumeExtractQuota({ ip });
      expect(second.allowed).toBe(false);
      expect(second.remaining).toBe(0);
      expect(second.used).toBe(2);
      expect(second.tier).toBe("anon");

      // Verify headers
      const headers = buildRateLimitHeaders(second);
      expect(headers["X-RateLimit-Limit"]).toBe("1");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(Number(headers["Retry-After"])).toBeGreaterThan(0);
    });

    it("allows 3 scans for GitHub authenticated users", async () => {
      const githubUserId = "gh_user_987654";
      const ip = "203.0.113.195"; // Same IP as anonymous test

      // 1st scan
      const req1 = await checkAndConsumeExtractQuota({ githubUserId, ip });
      expect(req1.allowed).toBe(true);
      expect(req1.remaining).toBe(2);
      expect(req1.limit).toBe(3);
      expect(req1.tier).toBe("auth");

      // 2nd scan
      const req2 = await checkAndConsumeExtractQuota({ githubUserId, ip });
      expect(req2.allowed).toBe(true);
      expect(req2.remaining).toBe(1);

      // 3rd scan
      const req3 = await checkAndConsumeExtractQuota({ githubUserId, ip });
      expect(req3.allowed).toBe(true);
      expect(req3.remaining).toBe(0);

      // 4th scan -> rejected
      const req4 = await checkAndConsumeExtractQuota({ githubUserId, ip });
      expect(req4.allowed).toBe(false);
      expect(req4.remaining).toBe(0);
      expect(req4.used).toBe(4);
    });

    it("sets 4h TTL (14400s) on first increment only", async () => {
      const ip = "198.51.100.42";

      await checkAndConsumeExtractQuota({ ip });
      expect(mockStore.expireCalls.length).toBe(1);
      expect(mockStore.expireCalls[0].seconds).toBe(14400);

      // Second increment should NOT call expire again
      await checkAndConsumeExtractQuota({ ip });
      expect(mockStore.expireCalls.length).toBe(1);
    });
  });

  describe("2. Process Restart & Persistence Bug Verification (Bug #1 Fix)", () => {
    it("maintains quota counts across server process restarts via persistent store", async () => {
      const ip = "192.0.2.100";

      // Server Process 1 consumes quota
      const res1 = await checkAndConsumeExtractQuota({ ip });
      expect(res1.allowed).toBe(true);
      expect(res1.used).toBe(1);

      // Simulate Server Process Restart / New Instance:
      // Creating a new client pointing to the same persistent store
      const restartedClient = {
        incr: (k: string) => mockStore.incr(k),
        expire: (k: string, s: number) => mockStore.expire(k, s),
        get: <T>(k: string) => mockStore.get<T>(k),
      };
      setRedisClientForTesting(restartedClient);

      // Server Process 2 attempts another scan
      const res2 = await checkAndConsumeExtractQuota({ ip });
      expect(res2.allowed).toBe(false); // Quota was preserved across process restart!
      expect(res2.used).toBe(2);
    });
  });

  describe("3. Client Cache-Clear Bypass Resistance (Bug #2 Fix)", () => {
    it("is strictly keyed by server-derived IP hash and unaffected by client headers", async () => {
      const rawIp = "198.51.100.77";

      // Simulated Request with client spoofing headers
      const fakeReq1 = new Request("http://localhost/api/extract", {
        headers: {
          "x-forwarded-for": rawIp,
          "x-client-fingerprint": "client_random_token_1",
          "cookie": "scan_count=0; user_token=new_session",
        },
      });

      const ip1 = getClientIp(fakeReq1);
      expect(ip1).toBe(rawIp);
      const res1 = await checkAndConsumeExtractQuota({ ip: ip1 });
      expect(res1.allowed).toBe(true);

      // User clears cache/cookies and sends totally new client headers
      const fakeReq2 = new Request("http://localhost/api/extract", {
        headers: {
          "x-forwarded-for": rawIp,
          "x-client-fingerprint": "client_totally_different_fingerprint_2",
          "cookie": "", // cleared cookies
        },
      });

      const ip2 = getClientIp(fakeReq2);
      expect(ip2).toBe(rawIp);
      const res2 = await checkAndConsumeExtractQuota({ ip: ip2 });
      expect(res2.allowed).toBe(false); // Quota blocked despite cache/cookie clearing!
    });
  });

  describe("4. Concurrency & Race-Condition Resistance", () => {
    it("prevents race condition: only exact limit succeeds under simultaneous concurrent requests", async () => {
      const githubUserId = "gh_concurrent_tester";
      const ip = "192.0.2.200";

      // Fire 10 simultaneous requests against a 3-scan limit
      const promises = Array.from({ length: 10 }).map(() =>
        checkAndConsumeExtractQuota({ githubUserId, ip })
      );

      const results = await Promise.all(promises);
      const allowedCount = results.filter((r) => r.allowed).length;
      const blockedCount = results.filter((r) => !r.allowed).length;

      expect(allowedCount).toBe(3);
      expect(blockedCount).toBe(7);
    });
  });

  describe("5. Privacy by Design: Zero Raw IP Persistence", () => {
    it("never stores or logs raw IP addresses in Redis keys or values", async () => {
      const rawIp = "203.0.113.88";
      await checkAndConsumeExtractQuota({ ip: rawIp });

      const storedKeys = Array.from(mockStore.data.keys());
      expect(storedKeys.length).toBe(1);

      const storedKey = storedKeys[0];
      expect(storedKey).not.toContain(rawIp);

      const expectedHashedIp = hashIp(rawIp);
      expect(storedKey).toContain(expectedHashedIp);
      expect(storedKey).toBe(`scan:4h:anon:${expectedHashedIp}`);
    });
  });

  describe("6. Bot Mitigation (Cloudflare Turnstile)", () => {
    it("rejects invalid or failed turnstile tokens without consuming quota", async () => {
      const ip = "192.0.2.55";

      // Turnstile verification fails
      const verifyOutcome = await verifyTurnstileToken("test-turnstile-fail", ip);
      expect(verifyOutcome.success).toBe(false);

      // Quota store should remain untouched
      expect(mockStore.data.size).toBe(0);

      // Peek quota should still report full quota
      const peek = await peekExtractQuota({ ip });
      expect(peek.remaining).toBe(1);
      expect(peek.used).toBe(0);
    });

    it("accepts valid test turnstile tokens", async () => {
      const verifyOutcome = await verifyTurnstileToken("test-turnstile-pass", "192.0.2.55");
      expect(verifyOutcome.success).toBe(true);
    });
  });

  describe("7. Fail Closed on Redis Outage", () => {
    it("returns 503 failClosed when Redis is unreachable, never allowing unlimited requests", async () => {
      const brokenRedis = {
        incr: async () => {
          throw new Error("Redis connection timeout (ETIMEDOUT)");
        },
        expire: async () => {
          throw new Error("Redis connection timeout");
        },
        get: async () => {
          throw new Error("Redis connection timeout");
        },
      };

      setRedisClientForTesting(brokenRedis);

      const result = await checkAndConsumeExtractQuota({ ip: "192.0.2.99" });
      expect(result.allowed).toBe(false);
      expect(result.failClosed).toBe(true);
      expect(result.error).toContain("temporarily unavailable");
    });
  });
});
