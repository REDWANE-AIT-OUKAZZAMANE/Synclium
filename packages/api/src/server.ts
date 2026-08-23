import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { basename } from "node:path";
import { buildRoutes } from "./routes.js";

export interface ServerOptions {
  port?: number;
  host?: string;
  enableSwagger?: boolean;
  rateLimitMax?: number;
}

export async function buildServer(opts: ServerOptions = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const enableSwagger = opts.enableSwagger ?? (process.env.ENABLE_SWAGGER === "true" || !isProduction);

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? (isProduction ? "warn" : "info"),
    },
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024, // 5MB max payload to prevent memory exhaustion DoS (OIB-005)
    connectionTimeout: 20000,
    keepAliveTimeout: 10000,
  });

  // Strict Rate Limiting (OIB-001)
  await app.register(rateLimit, {
    max: opts.rateLimitMax ?? (process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 30),
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"];
      const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null)
        || req.headers["x-real-ip"]
        || req.ip
        || "127.0.0.1";
      return String(ip);
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    }),
  });

  // OpenAPI Documentation (OIB-011)
  if (enableSwagger) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: "OpenInvoiceBridge API",
          description:
            "Convert and validate e-invoices across formats (UBL/PEPPOL BIS, Factur-X/ZUGFeRD, ZATCA) via a canonical hub. " +
            "**This is a technical utility, not certified compliance software** — validation covers structural and business-rule checks only. " +
            "**No uploaded invoice data is persisted** — everything is processed in memory.",
          version: "0.1.0",
        },
        tags: [
          { name: "invoice", description: "Convert / validate / extract operations" },
          { name: "meta", description: "Service metadata" },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
    });
  }

  buildRoutes(app);

  return app;
}

// Only auto-start when run directly (not when imported for tests)
const isMain = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));

export async function start(opts: ServerOptions = {}) {
  const app = await buildServer(opts);
  const port = opts.port ?? Number(process.env.PORT ?? 3000);
  const host = opts.host ?? process.env.HOST ?? "0.0.0.0";
  await app.listen({ port, host });
  return app;
}

if (isMain) {
  start().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
