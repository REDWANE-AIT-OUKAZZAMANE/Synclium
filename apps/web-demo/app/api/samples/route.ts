import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serve the repo's example invoices so the demo has one-click samples. */
export async function GET() {
  try {
    // examples/ lives at the monorepo root (three levels up from apps/web-demo)
    const examplesRoot = join(process.cwd(), "../../examples");
    const samples: Record<string, { name: string; label: string; content: string }[]> = {};

    for (const dir of ["ubl", "facturx", "zatca"]) {
      const full = join(examplesRoot, dir);
      let files: string[] = [];
      try {
        files = readdirSync(full).filter((f) => f.endsWith(".xml") && !f.startsWith("invalid-"));
      } catch {
        continue; // examples not present (e.g. standalone deployment)
      }
      samples[dir] = files.map((f) => ({
        name: f,
        label: f.replace(/\.xml$/, "").replace(/-/g, " "),
        content: readFileSync(join(full, f), "utf-8"),
      }));
    }

    return NextResponse.json({ samples });
  } catch (e) {
    return NextResponse.json({ samples: {}, error: (e as Error).message }, { status: 200 });
  }
}
