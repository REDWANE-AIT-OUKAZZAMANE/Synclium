import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { basename } from "node:path";
import { buildRoutes } from "./routes.js";

export interface ServerOptions {
  port?: number;
  host?: string;
}

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
    bodyLimit: 15 * 1024 * 1024, // allow reasonably sized PDFs/images
  });

  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

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
  });

  buildRoutes(app);

  return app;
}

// Only auto-start when run directly (not when imported for tests)
const isMain = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));

export async function start(opts: ServerOptions = {}) {
  const app = await buildServer();
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
