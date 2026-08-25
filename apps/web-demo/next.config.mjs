import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicitly load root and local .env files into process.env
function loadEnv() {
  const rootEnv = path.resolve(__dirname, "../../.env");
  const localEnv = path.resolve(__dirname, ".env");

  for (const envPath of [rootEnv, localEnv]) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
  },
  transpilePackages: [
    "@synclium-com/core",
    "@synclium-com/extract",
    "@synclium-com/registry",
    "@synclium-com/ubl",
    "@synclium-com/facturx",
    "@synclium-com/zatca",
  ],
};

export default nextConfig;
