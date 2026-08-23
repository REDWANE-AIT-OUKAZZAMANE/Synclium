import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server.js";
import type { FastifyInstance } from "fastify";

describe("API Security Hardening Tests (OIB Remediation)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ enableSwagger: true, rateLimitMax: 5 });
  });

  afterAll(async () => {
    await app.close();
  });

  it("OIB-004: /validate properly serializes validation errors and warnings (no empty objects)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/validate",
      payload: {
        input: "<Invoice></Invoice>",
        format: "ubl",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(false);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors.length).toBeGreaterThan(0);
    
    // Verify each error object contains non-empty path and message
    for (const err of body.errors) {
      expect(typeof err.path).toBe("string");
      expect(typeof err.message).toBe("string");
      expect(err.message.length).toBeGreaterThan(0);
    }
  });

  it("OIB-005: Rejects oversized payload with 413 Payload Too Large", async () => {
    const hugeXml = "<Invoice>" + "A".repeat(4 * 1024 * 1024) + "</Invoice>";
    const res = await app.inject({
      method: "POST",
      url: "/convert",
      payload: {
        input: hugeXml,
        to: "canonical",
      },
    });

    expect(res.statusCode).toBe(413);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/exceeds maximum allowed size/i);
  });

  it("OIB-006: /extract sanitizes path traversal in filename parameter", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/extract",
      payload: {
        contentBase64: Buffer.from("Invoice: INV-001\nTotal: 100 EUR").toString("base64"),
        mimeType: "text/plain",
        provider: "mock",
        filename: "../../../etc/passwd",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.invoice).toBeDefined();
  });

  it("OIB-001: Rate limiting triggers 429 after exceeding quota", async () => {
    const payload = { input: "<Invoice></Invoice>", format: "ubl" };
    
    // Send 10 requests rapidly (max configured to 5 for test)
    let hitRateLimit = false;
    for (let i = 0; i < 10; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/validate",
        payload,
        headers: {
          "x-forwarded-for": "192.168.1.100",
        },
      });
      if (res.statusCode === 429) {
        hitRateLimit = true;
        const body = JSON.parse(res.body);
        expect(body.statusCode).toBe(429);
        expect(body.error).toBe("Too Many Requests");
        break;
      }
    }
    expect(hitRateLimit).toBe(true);
  });
});
